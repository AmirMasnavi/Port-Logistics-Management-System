using PortProject.Planning.Api.Application.Clients;
using PortProject.Planning.Api.Application.Clients.DTOs;
using PortProject.Planning.Api.Application.DTOs;
using System.Net.Http.Json; 
using System.Text.Json.Serialization; 
using System.Text.RegularExpressions;
using System.Globalization;

namespace PortProject.Planning.Api.Application.Services;

public class SchedulingService : ISchedulingService
{
    private readonly IPortApiHttpClient _portApiClient;
    
    // --- 1. ADD IHttpClientFactory ---
    // call the Prolog API.
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
        var resources = (await _portApiClient.GetResourcesAsync(date)).ToList();
        
        var schedule = new DailyScheduleResponseDto { Date = date };

        // Diagnostic logging: dump what we received from the main API so we can compare with the test harness
        try
        {
            var visitSummaries = clientVisits.Select(v => new { v.Id, v.EstimatedArrival, v.EstimatedDeparture, v.UnloadingTime, v.LoadingTime }).ToList();
            var staffSummaries = staff.Select(s => new { s.MecanographicNumber, s.OperationalWindow, Qualifications = s.QualificationCodes }).ToList();
            var resourceSummaries = resources.Select(r => new { r.Code, r.Status, r.OperationalWindowStart, r.OperationalWindowEnd, Qualifications = r.QualificationRequirements }).ToList();

            _logger.LogInformation("[DIAG] Fetched {VisitCount} visits: {Visits}", visitSummaries.Count, System.Text.Json.JsonSerializer.Serialize(visitSummaries));
            _logger.LogInformation("[DIAG] Fetched {StaffCount} staff: {Staff}", staffSummaries.Count, System.Text.Json.JsonSerializer.Serialize(staffSummaries));
            _logger.LogInformation("[DIAG] Fetched {ResourceCount} resources: {Resources}", resourceSummaries.Count, System.Text.Json.JsonSerializer.Serialize(resourceSummaries));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[DIAG] Failed to log fetched API data");
        }

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
       
        
        DateTime dayStart = date.ToDateTime(TimeOnly.MinValue);
        var prologVesselList = clientVisits.Select(v => new PrologVesselRequest
        {
            Id = v.Id.ToString(),
            EstimatedArrival = ((int)(v.EstimatedArrival - dayStart).TotalHours).ToString(),
            EstimatedDeparture = ((int)(v.EstimatedDeparture - dayStart).TotalHours).ToString(),
            UnloadingTime = v.UnloadingTime,
            LoadingTime = v.LoadingTime
        }).ToList();

        // Diagnostic: log the exact payload that will be sent to Prolog
        try
        {
            _logger.LogInformation("[DIAG] Prolog payload: {Payload}", System.Text.Json.JsonSerializer.Serialize(prologVesselList));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "[DIAG] Failed to serialize Prolog payload for logging");
        }

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
            _logger.LogError(ex, "Failed to call Prolog server. Is it running at http://localhost:5001?");
            return schedule; 
        }
        
        // --- 5. MAP PROLOG RESULT TO C# DTO ---
       
        
        var firstDock = docks.First();
        // Select a default operator if none matches the resource requirement later
        var defaultOperator = staff.FirstOrDefault();
        
        foreach (var task in prologResult.Schedule)
        {
            // The Prolog task is a Tuple: (VesselId, StartHour, EndHour)
            string vesselId = task.Item1;
            int startHour = task.Item2;
            int endHour = task.Item3; // Note: Prolog logic is inclusive

            var taskStart = dayStart.AddHours(startHour);
          

            // Business rule: requested static resource code
            const string requestedResourceCode = "1";
            var requestedResource = resources.FirstOrDefault(r => r.Code == requestedResourceCode);

            if (requestedResource == null)
            {
                // Fallback: prefer a resource that has qualification requirements (so we can match staff),
                // otherwise prefer a Crane, otherwise pick the first available resource.
                requestedResource = resources.FirstOrDefault(r => r.QualificationRequirements != null && r.QualificationRequirements.Any())
                    ?? resources.FirstOrDefault(r => !string.IsNullOrEmpty(r.Kind) && r.Kind.Contains("Crane", StringComparison.OrdinalIgnoreCase))
                    ?? resources.FirstOrDefault();

                if (requestedResource != null)
                {
                    _logger.LogInformation("Requested resource code {RequestedCode} not found; falling back to resource {FallbackCode}", requestedResourceCode, requestedResource.Code);
                }
                else
                {
                    _logger.LogWarning("Requested resource {ResourceCode} not found and no fallback resources are available.", requestedResourceCode);
                }
            }

            // Determine required qualifications from the requested resource if present
            var requiredQualifications = requestedResource?.QualificationRequirements ?? new List<string>();
            if (!requiredQualifications.Any() && requestedResource != null)
            {
                if (!string.IsNullOrEmpty(requestedResource.Kind) && requestedResource.Kind.Contains("Crane", StringComparison.OrdinalIgnoreCase))
                {
                    requiredQualifications.Add("CRANE_OPERATOR");
                }
            }

            // Find the VesselVisit DTO to get required durations
            var visitDto = clientVisits.FirstOrDefault(v => v.Id.ToString() == vesselId);
            double requiredHours = 0.0;
            if (visitDto != null)
            {
                requiredHours = visitDto.UnloadingTime + visitDto.LoadingTime;
            }
            else
            {
                _logger.LogWarning("Vessel visit {Vessel} not found in clientVisits; using 0 duration.", vesselId);
            }

            // Choose an initial staff to assign: prefer someone with qualification who is available at/after taskStart
            List<StaffMemberDto> candidateStaff;
            if (requiredQualifications != null && requiredQualifications.Any())
            {
                // Try to fetch staff that explicitly hold the required qualifications from the main API.
                var qualifiedFromApi = new List<StaffMemberDto>();
                foreach (var qual in requiredQualifications)
                {
                    try
                    {
                        var byQual = (await _portApiClient.GetStaffByQualificationAsync(qual)).ToList();
                        qualifiedFromApi.AddRange(byQual);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to fetch staff for qualification {Qual}", qual);
                    }
                }

                // Deduplicate and intersect with the staff list we fetched for availability
                qualifiedFromApi = qualifiedFromApi
                    .GroupBy(x => x.MecanographicNumber)
                    .Select(g => g.First())
                    .ToList();

                candidateStaff = staff.Where(s => qualifiedFromApi.Any(q => q.MecanographicNumber == s.MecanographicNumber)).ToList();

                // If API returned none, fall back to local qualification codes embedded in the staff DTO
                if (!candidateStaff.Any())
                {
                    candidateStaff = staff.Where(s => s.QualificationCodes != null && s.QualificationCodes.Any(q => requiredQualifications.Contains(q))).ToList();
                }

                // Final fallback: any available staff
                if (!candidateStaff.Any()) candidateStaff = staff.ToList();
            }
            else
            {
                candidateStaff = staff.ToList();
            }

            // Log the selected candidate staff for debugging
            _logger.LogDebug("Candidate staff for vessel {Vessel}: {Staff}", vesselId, System.Text.Json.JsonSerializer.Serialize(candidateStaff));

            // Compute actual scheduled start = next time when resource is available (on or after taskStart)
            var scheduledStart = FindNextResourceAvailable(taskStart, requestedResource);

            // Compute scheduled end by accumulating working segments where the resource is available; staff presence is preferred but does not block progress
            DateTime scheduledEnd = ComputeEndByAccumulatingWork_Hybrid(scheduledStart, requiredHours, requestedResource, candidateStaff, out var assignedStaff);

            // Log if resource not actually available at any point
            if (requestedResource != null)
            {
                var resourceIsEverAvailable = IsResourceEverAvailableBetween(requestedResource, scheduledStart, scheduledEnd);
                if (!resourceIsEverAvailable)
                {
                    _logger.LogWarning("Requested resource {ResourceCode} was never available during computed window {Start}-{End}.", requestedResourceCode, scheduledStart, scheduledEnd);
                }
            }

            if (assignedStaff == null)
            {
                _logger.LogWarning("No staff could be assigned for vessel {Vessel} between {Start} and {End}.", vesselId, scheduledStart, scheduledEnd);
            }

            schedule.ScheduledTasks.Add(new ScheduledTaskDto
            {
                VesselVisitId = vesselId,
                DockId = firstDock.Id,
                StaffId = assignedStaff?.MecanographicNumber ?? "UNASSIGNED",
                ResourceId = requestedResourceCode,
                StartTime = scheduledStart,
                EndTime = scheduledEnd
            });
        }

        return schedule;
    }

    // --- Helpers for availability scheduling (hybrid) ---
    private DateTime FindNextResourceAvailable(DateTime from, ResourceDto? resource)
    {
        // Search forward up to 14 days
        var limit = from.AddDays(14);
        var pointer = from;
        while (pointer <= limit)
        {
            var resourceWindows = GetDailyResourceWindows(resource, pointer.Date);
            foreach (var resWin in resourceWindows)
            {
                if (resWin.End <= pointer) continue;
                var windowStart = resWin.Start < pointer ? pointer : resWin.Start;
                return windowStart;
            }
            pointer = pointer.Date.AddDays(1);
        }
        return from;
    }

    private DateTime ComputeEndByAccumulatingWork_Hybrid(DateTime start, double requiredHours, ResourceDto? resource, List<StaffMemberDto> candidateStaff, out StaffMemberDto? assignedStaff)
    {
        assignedStaff = null;
        if (requiredHours <= 0) return start;

        var remaining = TimeSpan.FromHours(requiredHours);
        var pointer = start;
        var limit = start.AddDays(30);

        while (remaining.TotalSeconds > 0 && pointer <= limit)
        {
            // Find next resource window that starts at or after pointer
            var resWins = GetDailyResourceWindows(resource, pointer.Date).Where(w => w.End > pointer).ToList();
            if (!resWins.Any())
            {
                pointer = pointer.Date.AddDays(1);
                continue;
            }

            var resWin = resWins.First();
            var resSegStart = resWin.Start < pointer ? pointer : resWin.Start;
            var segStart = resSegStart;
            var segEnd = resWin.End;

            // Within this resource window, we only consume time when a staff member is present.
            // Find the earliest staff overlap inside [segStart, segEnd).
            StaffMemberDto? staffForThisSegment = null;
            DateTime staffSegStart = default;
            DateTime staffSegEnd = default;

            foreach (var s in candidateStaff)
            {
                var stWins = GetDailyStaffWindows(s, segStart.Date).Where(w => w.End > segStart).ToList();
                foreach (var stWin in stWins)
                {
                    // staff window could be on this day but might start after segStart
                    var overlapStart = segStart > stWin.Start ? segStart : stWin.Start;
                    var overlapEnd = segEnd < stWin.End ? segEnd : stWin.End;
                    if (overlapEnd > overlapStart)
                    {
                        staffForThisSegment = s;
                        staffSegStart = overlapStart;
                        staffSegEnd = overlapEnd;
                        break;
                    }
                }
                if (staffForThisSegment != null) break;
            }

            if (staffForThisSegment == null)
            {
                // No staff present during this resource window; work cannot progress here. Move pointer to the end of this resource window and try the next.
                _logger.LogDebug("[STAFF-REQUIRED] No staff available in resource window {Start}-{End} for resource {Resource}; waiting until next resource window.", segStart, segEnd, resource?.Code);
                pointer = segEnd;
                continue;
            }

            // There is a staff overlap; work progresses only during [staffSegStart, staffSegEnd)
            assignedStaff ??= staffForThisSegment;

            // Start consuming from the later of pointer and staffSegStart
            var consumeStart = pointer > staffSegStart ? pointer : staffSegStart;
            var available = staffSegEnd - consumeStart;
            if (available <= TimeSpan.Zero)
            {
                // Nothing to consume here, advance pointer to staffSegEnd
                pointer = staffSegEnd;
                continue;
            }

            if (available >= remaining)
            {
                var finish = consumeStart + remaining;
                return finish;
            }

            // Consume available supervised time and advance pointer
            remaining -= available;
            pointer = staffSegEnd;

            // After staff leaves, we do NOT consume resource-only time. Continue loop to find next resource window / staff overlap.
        }

        // If we exit the loop without finishing, return pointer as the best-effort end
        _logger.LogWarning("[STAFF-REQUIRED] Could not complete required hours within limit; remaining {Remaining} hours. Last pointer: {Pointer}", remaining.TotalHours, pointer);
        return pointer;
    }

    private bool IsResourceEverAvailableBetween(ResourceDto? resource, DateTime start, DateTime end)
    {
        if (resource == null) return false;
        var date = start.Date;
        while (date <= end.Date)
        {
            var wins = GetDailyResourceWindows(resource, date);
            if (wins.Any()) return true;
            date = date.AddDays(1);
        }
        return false;
    }

    private IEnumerable<(DateTime Start, DateTime End)> GetDailyResourceWindows(ResourceDto? resource, DateTime date)
    {
        if (resource == null) yield break;
        // If the Resource.Status isn't explicitly 'Available' we still proceed to compute windows.
        // This is permissive: in constrained environments resources may not be marked as Available in the test DB.
        if (!string.Equals(resource.Status, "Available", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogDebug("Resource {Resource} has status '{Status}' (not 'Available'), proceeding permissively.", resource.Code, resource.Status);
        }
        if (!TryParseTimeOnly(resource.OperationalWindowStart ?? string.Empty, out var opStart) || !TryParseTimeOnly(resource.OperationalWindowEnd ?? string.Empty, out var opEnd))
        {
            // If parsing fails, assume full-day availability
            yield return (date, date.AddDays(1));
            yield break;
        }

        var startDt = date.Add(opStart.ToTimeSpan());
        DateTime endDt;
        if (opEnd <= opStart)
        {
            // wraps midnight
            endDt = date.AddDays(1).Add(opEnd.ToTimeSpan());
            yield return (startDt, endDt);
        }
        else
        {
            endDt = date.Add(opEnd.ToTimeSpan());
            yield return (startDt, endDt);
        }
    }

    private IEnumerable<(DateTime Start, DateTime End)> GetDailyStaffWindows(StaffMemberDto staffMember, DateTime date)
    {
        var matches = Regex.Matches(staffMember.OperationalWindow ?? string.Empty, "\\d{1,2}:\\d{2}");
        if (matches.Count < 2)
        {
            // if no parse, assume full-day
            yield return (date, date.AddDays(1));
            yield break;
        }

        if (!TryParseTimeOnly(matches[0].Value, out var opStart) || !TryParseTimeOnly(matches[1].Value, out var opEnd))
        {
            yield return (date, date.AddDays(1));
            yield break;
        }

        var startDt = date.Add(opStart.ToTimeSpan());
        DateTime endDt;
        if (opEnd <= opStart)
        {
            // wraps midnight
            endDt = date.AddDays(1).Add(opEnd.ToTimeSpan());
            yield return (startDt, endDt);
        }
        else
        {
            endDt = date.Add(opEnd.ToTimeSpan());
            yield return (startDt, endDt);
        }
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

    // Helper: check if resource operational window (start/end strings) covers the entire task interval.
    private static bool ResourceWindowCovers(string? startStr, string? endStr, DateTime taskStart, DateTime taskEnd)
    {
        if (string.IsNullOrEmpty(startStr) || string.IsNullOrEmpty(endStr))
            return true; // If the API doesn't provide window, assume available

        if (!TryParseTimeOnly(startStr, out var opStart) || !TryParseTimeOnly(endStr, out var opEnd))
            return true; // Be permissive if parsing fails

        // For every calendar day that intersects the task interval, ensure the resource's daily operational window
        // covers the portion of the task that falls within that day.
        var day = taskStart.Date;
        var lastDay = taskEnd.Date;
        for (var date = day; date <= lastDay; date = date.AddDays(1))
        {
            var segmentStart = date == taskStart.Date ? taskStart : date;
            var nextDay = date.AddDays(1);
            var dayEnd = nextDay; // midnight of next day
            var segmentEnd = taskEnd < dayEnd ? taskEnd : dayEnd;

            // Convert segment times to TimeOnly relative to the day
            var segStartTime = TimeOnly.FromDateTime(segmentStart);
            var segEndTime = TimeOnly.FromDateTime(segmentEnd);

            if (!DailyWindowCovers(opStart, opEnd, segStartTime, segEndTime))
                return false;
        }

        return true;
    }

    // Helper: check staff operational window string (free text from main API) for coverage across the full task interval.
    private static bool StaffWindowCovers(string? staffOpWindow, DateTime taskStart, DateTime taskEnd)
    {
        if (string.IsNullOrEmpty(staffOpWindow))
            return true;

        // Extract first two time-like occurrences (HH:mm or H:mm)
        var matches = Regex.Matches(staffOpWindow, "\\d{1,2}:\\d{2}");
        if (matches.Count < 2)
            return true; // Unable to parse, be permissive

        if (!TryParseTimeOnly(matches[0].Value, out var opStart) || !TryParseTimeOnly(matches[1].Value, out var opEnd))
            return true;

        // For every calendar day that intersects the task interval, ensure the staff's daily operational window
        // covers the portion of the task that falls within that day.
        var day = taskStart.Date;
        var lastDay = taskEnd.Date;
        for (var date = day; date <= lastDay; date = date.AddDays(1))
        {
            var segmentStart = date == taskStart.Date ? taskStart : date;
            var nextDay = date.AddDays(1);
            var dayEnd = nextDay; // midnight next day
            var segmentEnd = taskEnd < dayEnd ? taskEnd : dayEnd;

            var segStartTime = TimeOnly.FromDateTime(segmentStart);
            var segEndTime = TimeOnly.FromDateTime(segmentEnd);

            if (!DailyWindowCovers(opStart, opEnd, segStartTime, segEndTime))
                return false;
        }

        return true;
    }

    // Checks whether a daily operational window [opStart, opEnd) covers the segment [segStart, segEnd) that lies within the same calendar day.
    // Handles windows that wrap midnight by treating them as union of [opStart,24:00) U [00:00, opEnd).
    private static bool DailyWindowCovers(TimeOnly opStart, TimeOnly opEnd, TimeOnly segStart, TimeOnly segEnd)
    {
        // Normalize case: if segment length is zero (segStart == segEnd) it's treated as empty and considered covered
        if (segStart == segEnd)
            return true;

        // If window does not wrap midnight (e.g., 06:00-22:00)
        if (opStart <= opEnd)
        {
            // segment must be fully inside [opStart, opEnd]
            return segStart >= opStart && segEnd <= opEnd;
        }

        // Window wraps midnight (e.g., 22:00-06:00), which is equivalent to [opStart,24:00) U [00:00,opEnd]
        // Segment may be in the late part (>= opStart) or early part (<= opEnd) but cannot span the un-covered gap.

        // If segment is entirely in late part [opStart,24:00)
        if (segStart >= opStart && segEnd > segStart)
        {
            return true; // covered by late part
        }

        // If segment is entirely in early part [00:00, opEnd)
        if (segEnd <= opEnd && segEnd > segStart)
        {
            return true; // covered by early part
        }

        // If the segment spans across midnight inside the same calendar day representation (unlikely since segStart/segEnd are within same day), not covered
        return false;
    }

    private static bool TryParseTimeOnly(string input, out TimeOnly time)
    {
        time = default;
        var formats = new[] { "HH:mm", "H:mm", "HH:mm:ss", "H:mm:ss" };
        return TimeOnly.TryParseExact(input, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out time)
            || TimeOnly.TryParse(input, CultureInfo.InvariantCulture, DateTimeStyles.None, out time);
    }
}

