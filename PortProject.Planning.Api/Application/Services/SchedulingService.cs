using PortProject.Planning.Api.Application.Clients;
using PortProject.Planning.Api.Application.Clients.DTOs;
using PortProject.Planning.Api.Application.DTOs;
using System.Net.Http.Json; // <-- REQUIRED
using System.Text.Json.Serialization; // <-- REQUIRED

namespace PortProject.Planning.Api.Application.Services;

public class SchedulingService : ISchedulingService
{
    private readonly IPortApiHttpClient _portApiClient;
    
    // --- 1. ADD IHttpClientFactory ---
    // This is new. You need it to call the Prolog API.
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SchedulingService> _logger;

    // --- 2. UPDATE THE CONSTRUCTOR ---
    public SchedulingService(
        IPortApiHttpClient portApiClient, 
        IHttpClientFactory httpClientFactory, 
        ILogger<SchedulingService> logger)
    {
        _portApiClient = portApiClient;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<DailyScheduleResponseDto> GenerateDailySchedule(DateOnly date)
    {
        // 1. Consumir dados do API principal (This part is correct)
        var docks = (await _portApiClient.GetDocksAsync()).ToList();
        var staff = (await _portApiClient.GetAvailableStaffAsync(date)).ToList();
        var clientVisits = (await _portApiClient.GetPendingVisitsAsync(date)).ToList();
        
        var schedule = new DailyScheduleResponseDto { Date = date };

        // Validação de recursos (This part is correct)
        if (!clientVisits.Any())
        {
            _logger.LogWarning("No pending visits for {Date}, returning empty schedule.", date);
            return schedule; // Sem visitas, sem agendamento
        }

        if (!docks.Any() || !staff.Any())
        {
            _logger.LogWarning("No docks or staff available for {Date}, returning empty schedule.", date);
            return schedule;
        }

        // --- 3. PREPARE DATA FOR PROLOG ---
        // This REPLACES your C# mapping logic.
        
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // !!!!!!!! CRITICAL FIXME !!!!!!!!!!!!
        // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        // Your `clientVisits` (from GetPendingVisitsAsync) MUST contain UnloadingTime and LoadingTime.
        // Your comment says "(no data from client API)". This is a blocker.
        // You MUST fix the `PortProject.Planning.Api/Application/Clients/DTOs/VesselVisitDto.cs`
        // and the main API to provide this data.
        //
        // I will assume you HAVE fixed this and that `clientVisits` now contains these fields.
        
        DateTime dayStart = date.ToDateTime(TimeOnly.MinValue);
        var prologVesselList = clientVisits.Select(v => new PrologVesselRequest
        {
            Id = v.Id.ToString(),
            
            // Calculate total hours from the start of the day.
            // This matches the Prolog logic (e.g., 6, 23, 63)
            EstimatedArrival = ((int)(v.EstimatedArrival - dayStart).TotalHours).ToString(),
            EstimatedDeparture = ((int)(v.EstimatedDeparture - dayStart).TotalHours).ToString(),
            
            // These MUST come from your client API.
            // Using 0.0 as in your old code will make the algorithm fail.
            UnloadingTime = v.UnloadingTime, // <-- FIXME: Ensure this has a value
            LoadingTime = v.LoadingTime      // <-- FIXME: Ensure this has a value
        }).ToList();
        

        // --- 4. CALL PROLOG SERVER ---
        // This REPLACES FindBestSequence, GetPermutations, etc.
        PrologScheduleResponse? prologResult;
        try
        {
            var prologClient = _httpClientFactory.CreateClient("PrologApiClient");
            
            _logger.LogInformation("Sending {Count} vessels to Prolog server...", prologVesselList.Count);
            
            // Call the Prolog server running on http://localhost:5001
            HttpResponseMessage prologResponse = await prologClient.PostAsJsonAsync("http://localhost:5001/api/schedule", prologVesselList);

            if (prologResponse.IsSuccessStatusCode)
            {
                // Read the JSON response from Prolog: { "schedule": [...], "delay": ... }
                prologResult = await prologResponse.Content.ReadFromJsonAsync<PrologScheduleResponse>();
                
                if (prologResult == null)
                {
                     _logger.LogError("Failed to deserialize response from Prolog.");
                     return schedule; // Return empty schedule on error
                }
                
                _logger.LogInformation("Received schedule from Prolog with {Count} tasks and delay {Delay}", 
                    prologResult.Schedule.Count, prologResult.Delay);
            }
            else
            {
                // The Prolog server returned an error
                string errorContent = await prologResponse.Content.ReadAsStringAsync();
                _logger.LogError("Error from Prolog server ({StatusCode}): {Error}", prologResponse.StatusCode, errorContent);
                return schedule; // Return empty schedule on error
            }
        }
        catch (Exception ex)
        {
            // Could not connect to Prolog server
            _logger.LogError(ex, "Failed to call Prolog server. Is it running at http://localhost:5001?");
            // You could add a user-friendly error message to the response DTO
            return schedule; // Return empty schedule on error
        }
        
        // --- 5. MAP PROLOG RESULT TO C# DTO ---
        // (This is similar to your old code, but uses the prologResult)
        
        var firstDock = docks.First();
        var firstOperator = staff.FirstOrDefault(s => s.QualificationCodes.Contains("CRANE_OPERATOR")) ?? staff.First();
        
        foreach (var task in prologResult.Schedule)
        {
            // The Prolog task is a Tuple: (VesselId, StartHour, EndHour)
            string vesselId = task.Item1;
            int startHour = task.Item2;
            int endHour = task.Item3; // Note: Prolog logic is inclusive

            schedule.ScheduledTasks.Add(new ScheduledTaskDto
            {
                VesselVisitId = vesselId, // Prolog returns the ID as a string
                DockId = firstDock.Id,
                StaffId = firstOperator.MecanographicNumber,
                ResourceId = "CRANE-01", // Placeholder
                StartTime = dayStart.AddHours(startHour),
                // Add 1 hour because Prolog's TEndLoad is inclusive (e.g., 8 to 24 is 17 hours)
                // C# EndTime is exclusive.
                EndTime = dayStart.AddHours(endHour + 1) 
            });
        }
        
        return schedule;
    }

    // --- 6. ADD HELPER CLASSES FOR JSON (De)serialization ---
    // These can be inside your class or in separate files.
    // Putting them here is simpler.

    private class PrologVesselRequest
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("estimatedArrival")]
        public string EstimatedArrival { get; set; }

        [JsonPropertyName("estimatedDeparture")]
        public string EstimatedDeparture { get; set; }

        [JsonPropertyName("unloadingTime")]
        public double UnloadingTime { get; set; }

        [JsonPropertyName("loadingTime")]
        public double LoadingTime { get; set; }
    }

    private class PrologScheduleResponse
    {
        // Prolog returns: "schedule": [["vc",8,24], ["vb",25,40], ...]
        [JsonPropertyName("schedule")]
        public List<List<object>>? ScheduleRaw { get; set; }

        [JsonIgnore]
        public List<Tuple<string, int, int>> Schedule
        {
            get
            {
                return ScheduleRaw?
                    .Select(item => new Tuple<string, int, int>(
                        item[0].ToString() ?? "",
                        int.Parse(item[1].ToString() ?? "0"),
                        int.Parse(item[2].ToString() ?? "0")
                    ))
                    .ToList() ?? new List<Tuple<string, int, int>>();
            }
        }

        [JsonPropertyName("delay")]
        public double Delay { get; set; }
    }
}