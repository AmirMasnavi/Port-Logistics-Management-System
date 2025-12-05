using PortProject.Planning.Api.Application.Clients;
using PortProject.Planning.Api.Application.Clients.DTOs;
using PortProject.Planning.Api.Application.DTOs;
using System.Net.Http.Json; 
using System.Text.Json.Serialization; 
using System.Text.RegularExpressions;
using System.Globalization;
using System.Diagnostics;

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

    public async Task<DailyScheduleResponseDto> GenerateDailySchedule(DateOnly date, string algorithm = "optimal", GeneticAlgorithmParamsDto? geneticParams = null)
    {
        var schedule = new DailyScheduleResponseDto { Date = date };
        // Métricas de Execução
        // O Stopwatch inicia aqui para medir o tempo total da operação (incluindo overhead de rede).
        // Este valor será retornado no DTO para comparação de performance (Heuristic vs Optimal vs Genetic).
        var sw = Stopwatch.StartNew();

        DailyScheduleResponseDto Finish()
        {
            try { sw.Stop(); } catch { }
            schedule.ExecutionTimeMs = sw.Elapsed.TotalMilliseconds;
            return schedule;
        }

        // 1. Consumir dados do API principal (This part is correct)
        var docks = (await _portApiClient.GetDocksAsync()).ToList();
        var staff = (await _portApiClient.GetAvailableStaffAsync(date)).ToList();
        var clientVisits = (await _portApiClient.GetPendingVisitsAsync(date)).ToList();
        var resources = (await _portApiClient.GetResourcesAsync(date)).ToList();

        // Early detection: if the statically-requested resource (code "1") exists but is not Active,
        // add a warning immediately so callers see it even if scheduling aborts earlier.
        const string staticRequiredResourceCode = "1";
        var staticRequestedResource = resources.FirstOrDefault(r => r.Code == staticRequiredResourceCode);
        if (staticRequestedResource != null && !string.Equals(staticRequestedResource.Status, "Active", StringComparison.OrdinalIgnoreCase))
        {
            var inactiveMsg = "resource required is inactive";
            _logger.LogWarning("{Msg} (resource {ResourceCode} status={Status})", inactiveMsg, staticRequestedResource.Code, staticRequestedResource.Status);
            if (!schedule.Warnings.Contains(inactiveMsg)) schedule.Warnings.Add(inactiveMsg);
        }

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
            return Finish(); // Sem visitas, sem agendamento
        }

        if (!docks.Any() || !staff.Any())
        {
            _logger.LogWarning("No docks or staff available for {Date}, returning empty schedule.", date);
            return Finish();
        }

        // --- 3. PREPARE DATA FOR PROLOG ---
       
        
        DateTime dayStart = date.ToDateTime(TimeOnly.MinValue);
        // Send BusinessId to Prolog instead of Id (GUID), since API doesn't return GUID Id field
        var prologVesselList = clientVisits.Select(v => new PrologVesselRequest
        {
            Id = v.BusinessId,  // Use BusinessId instead of v.Id.ToString()
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
            
            _logger.LogInformation("Sending {Count} vessels to Prolog server using {Algorithm} algorithm...", prologVesselList.Count, algorithm);
            // Algorithm Isolation and Routing
            // Garante que o pedido é encaminhado para o endpoint correto baseado no input.
            // 'heuristic' -> /api/schedule/heuristic (US 3.4.4)
            // 'optimal'   -> /api/schedule/optimal   (US 3.4.2)
            string prologEndpoint = algorithm?.ToLower() switch
            {
                "heuristic" => "http://localhost:5001/api/schedule/heuristic",
                "multicrane" => "http://localhost:5001/api/schedule/multicrane",
                "genetic" => "http://localhost:5001/api/schedule/genetic",  // ADD GENETIC ENDPOINT
                _ => "http://localhost:5001/api/schedule/optimal" // default
            };
            
            _logger.LogInformation("Using Prolog endpoint: {Endpoint}", prologEndpoint);
            
            HttpResponseMessage prologResponse = await prologClient.PostAsJsonAsync(prologEndpoint, prologVesselList);

            if (prologResponse.IsSuccessStatusCode)
            {
                // Read the raw response first for logging
                var rawResponse = await prologResponse.Content.ReadAsStringAsync();
                _logger.LogInformation("[DIAG] Raw Prolog response: {Response}", rawResponse);
                
                // Deserialize the JSON response from Prolog: { "schedule": [...], "delay": ... }
                prologResult = System.Text.Json.JsonSerializer.Deserialize<PrologScheduleResponse>(rawResponse, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                
                if (prologResult == null)
                {
                     _logger.LogError("Failed to deserialize response from Prolog.");
                     return Finish(); // Return empty schedule on error
                }
                
                // Captura de Métricas
                // O TotalDelay é capturado diretamente da resposta do Prolog para logs/auditoria inicial.
                // Nota: O tempo de execução (ExecutionTimeMs) é calculado pelo Stopwatch no método 'Finish()'.
                
                schedule.TotalDelay = prologResult.Delay;
                
                _logger.LogInformation("Received schedule from Prolog with {Count} tasks and delay {Delay} hours", 
                    prologResult.Schedule.Count, prologResult.Delay);
                _logger.LogInformation("[DIAG] TotalDelay set to: {TotalDelay}", schedule.TotalDelay);
            }
            else
            {
                // The Prolog server returned an error
                string errorContent = await prologResponse.Content.ReadAsStringAsync();
                _logger.LogError("Error from Prolog server ({StatusCode}): {Error}", prologResponse.StatusCode, errorContent);
                return Finish(); // Return empty schedule on error
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to call Prolog server. Is it running at http://localhost:5001?");
            return Finish(); 
        }
        
        // --- 5. MAP PROLOG RESULT TO C# DTO ---
       
        // Create lookup dictionaries for fast access by BusinessId (case-insensitive)
        // Since the API doesn't return a GUID "Id" field, all visits have default GUID 00000000-0000-0000-0000-000000000000
        // We must use BusinessId as the unique key instead
        var vesselVisitMap = clientVisits.ToDictionary(
            v => v.BusinessId.ToLowerInvariant(), 
            v => v,
            StringComparer.OrdinalIgnoreCase
        );
        
        var dockMap = docks.ToDictionary(
            d => d.Id.ToLowerInvariant(),
            d => d,
            StringComparer.OrdinalIgnoreCase
        );
        
        // Select a default operator if none matches the resource requirement later
        var defaultOperator = staff.FirstOrDefault();
        
        // Log what we're about to process for debugging
        _logger.LogInformation("[DIAG] Processing {Count} tasks from Prolog schedule", prologResult.Schedule.Count);
        _logger.LogInformation("[DIAG] Created lookup map for {VisitCount} vessel visits", vesselVisitMap.Count);
        _logger.LogInformation("[DIAG] Vessel visits in map (by BusinessId): {Visits}", 
            string.Join(", ", vesselVisitMap.Values.Select(v => $"{v.BusinessId}(Dock:{v.DockId})")));
        
        foreach (var task in prologResult.Schedule)
        {
            // The Prolog task is a Tuple: (VesselId, StartHour, EndHour)
            string vesselIdFromProlog = task.Item1;
            int startHour = task.Item2;
            int endHour = task.Item3; // Note: Prolog logic is inclusive

            var taskStart = dayStart.AddHours(startHour);
          
            _logger.LogInformation("[DIAG] Processing task for vessel ID from Prolog: '{VesselId}'", vesselIdFromProlog);
          
            // Find the VesselVisit DTO using the lookup map (case-insensitive)
            VesselVisitDto? visitDto = null;
            string lookupKey = vesselIdFromProlog.ToLowerInvariant();
            
            if (vesselVisitMap.TryGetValue(lookupKey, out var foundVisit))
            {
                visitDto = foundVisit;
                _logger.LogInformation("[DIAG] ✓ Found visit via map: {BusinessId} (GUID: {Guid}) with dock {DockId}", 
                    visitDto.BusinessId, visitDto.Id, visitDto.DockId);
            }
            else
            {
                _logger.LogError("[DIAG] ✗ Could not find vessel visit for ID '{VesselId}' in map. Available keys: {Keys}", 
                    vesselIdFromProlog, string.Join(", ", vesselVisitMap.Keys.Take(5)));
            }
            
            double requiredHours = 0.0;
            Guid? vesselAssignedDockId = null;
            
            if (visitDto != null)
            {
                requiredHours = visitDto.UnloadingTime + visitDto.LoadingTime;
                vesselAssignedDockId = visitDto.DockId;
            }
            else
            {
                _logger.LogWarning("Vessel visit {Vessel} not found in clientVisits; using 0 duration.", vesselIdFromProlog);
            }

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

            // If the resource is found but isn't Active, add a warning so the caller can see the problem
            if (requestedResource != null && !string.Equals(requestedResource.Status, "Active", StringComparison.OrdinalIgnoreCase))
            {
                var inactiveMsg = "resource required is inactive";
                _logger.LogWarning("{Msg} (resource {ResourceCode} status={Status})", inactiveMsg, requestedResource.Code, requestedResource.Status);
                if (!schedule.Warnings.Contains(inactiveMsg))
                    schedule.Warnings.Add(inactiveMsg);
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
            _logger.LogDebug("Candidate staff for vessel {Vessel}: {Staff}", vesselIdFromProlog, System.Text.Json.JsonSerializer.Serialize(candidateStaff));

            // Compute actual scheduled start = next time when resource is available (on or after taskStart)
            var scheduledStart = FindNextResourceAvailable(taskStart, requestedResource);

            // We'll now ensure dock exclusivity (one vessel per dock at a time) and a single storage location
            // (no two tasks may overlap in storage).
            StaffMemberDto? assignedStaff = null;
            // Use the vessel's assigned dock GUID, not the vessel GUID
            string assignedDockId = vesselAssignedDockId?.ToString() ?? docks.FirstOrDefault()?.Id ?? string.Empty;
            
            _logger.LogInformation("[DIAG] Initial assignedDockId for vessel {VesselId}: {DockId}", vesselIdFromProlog, assignedDockId);
            
            DateTime scheduledEnd = scheduledStart;
            bool allocated = false;

            // Try to find a schedule that satisfies dock & storage exclusivity within 14 days
            var searchLimit = scheduledStart.AddDays(14);
            var attemptStart = scheduledStart;
            while (attemptStart <= searchLimit && !allocated)
            {
                // Recompute end for this attempt start (respecting staff-required policy)
                scheduledEnd = ComputeEndByAccumulatingWork_Hybrid(attemptStart, requiredHours, requestedResource, candidateStaff, out assignedStaff);

                // If the resource isn't available at all during [attemptStart, scheduledEnd], move to next resource window
                if (requestedResource != null && !IsResourceEverAvailableBetween(requestedResource, attemptStart, scheduledEnd))
                {
                    schedule.Warnings.Add($"Resource {requestedResource.Code} not available between {attemptStart:O} and {scheduledEnd:O}; searching next resource window.");
                    attemptStart = FindNextResourceAvailable(attemptStart.AddSeconds(1), requestedResource);
                    continue;
                }

                // If vessel has an assigned dock, prefer it; otherwise find any free dock
                string? freeDock = null;
                if (vesselAssignedDockId.HasValue)
                {
                    // Check if the vessel's assigned dock is free
                    var conflict = schedule.ScheduledTasks.Any(t => t.DockId == vesselAssignedDockId.ToString() && t.StartTime < scheduledEnd && t.EndTime > attemptStart);
                    if (!conflict)
                    {
                        freeDock = vesselAssignedDockId.ToString();
                    }
                    else
                    {
                        // If assigned dock is busy, look for any free dock
                        foreach (var d in docks)
                        {
                            var dockConflict = schedule.ScheduledTasks.Any(t => t.DockId == d.Id && t.StartTime < scheduledEnd && t.EndTime > attemptStart);
                            if (!dockConflict)
                            {
                                freeDock = d.Id;
                                break;
                            }
                        }
                    }
                }
                else
                {
                    // No assigned dock, find any free dock
                    foreach (var d in docks)
                    {
                        var conflict = schedule.ScheduledTasks.Any(t => t.DockId == d.Id && t.StartTime < scheduledEnd && t.EndTime > attemptStart);
                        if (!conflict)
                        {
                            freeDock = d.Id;
                            break;
                        }
                    }
                }

                // Check storage exclusivity: since we consider one storage location, ensure no existing scheduled task overlaps
                var storageConflict = schedule.ScheduledTasks.Any(t => t.StartTime < scheduledEnd && t.EndTime > attemptStart);

                if (freeDock != null && !storageConflict)
                {
                    assignedDockId = freeDock;
                    allocated = true;
                    break;
                }

                // If we reach here, either no dock free or storage conflict. Advance attemptStart to earliest conflicting task end and try again.
                var conflictingEnds = schedule.ScheduledTasks
                    .Where(t => t.StartTime < scheduledEnd && t.EndTime > attemptStart)
                    .Select(t => t.EndTime)
                    .ToList();

                if (conflictingEnds.Any())
                {
                    var nextAvailable = conflictingEnds.Min();
                    attemptStart = FindNextResourceAvailable(nextAvailable.AddSeconds(1), requestedResource);
                    continue;
                }

                // No explicit conflicting tasks found (should not normally happen) — break to avoid infinite loop
                break;
            }

            if (!allocated)
            {
                schedule.Warnings.Add($"Could not reserve dock/storage within 14 days for vessel {vesselIdFromProlog}; performing best-effort allocation.");
            }

            // Recompute scheduledEnd using the allocated/attempted start to be consistent
            if (allocated)
            {
                // assignedStaff was set by the compute call during successful attempt
            }
            else
            {
                // use last attempted times
                scheduledEnd = ComputeEndByAccumulatingWork_Hybrid(attemptStart, requiredHours, requestedResource, candidateStaff, out assignedStaff);
                scheduledStart = attemptStart;
            }

            // Add warning if no staff was assigned
            if (assignedStaff == null)
            {
                var msg = $"No staff could be assigned for vessel {vesselIdFromProlog} between {scheduledStart:O} and {scheduledEnd:O}.";
                _logger.LogWarning(msg);
                schedule.Warnings.Add(msg);
            }

            // Get display names for UI - prioritize dock name from vessel visit
            var vesselBusinessId = visitDto?.BusinessId ?? vesselIdFromProlog;
            
            // Use the dock name directly from the vessel visit if available
            string dockDisplayName;
            if (!string.IsNullOrEmpty(visitDto?.DockName))
            {
                dockDisplayName = visitDto.DockName;
                _logger.LogInformation("[DIAG] Using dock name from vessel visit: {DockName}", dockDisplayName);
            }
            else if (dockMap.TryGetValue(assignedDockId.ToLowerInvariant(), out var foundDock))
            {
                dockDisplayName = foundDock.Name;
                _logger.LogInformation("[DIAG] Using dock name from dock map: {DockName}", dockDisplayName);
            }
            else
            {
                dockDisplayName = assignedDockId;
                _logger.LogWarning("[DIAG] Could not find dock name for ID {DockId}, using ID as fallback", assignedDockId);
            }
            
            var resourceDisplayKind = requestedResource?.Kind ?? requestedResourceCode;
            var staffDisplayName = assignedStaff?.ShortName ?? assignedStaff?.MecanographicNumber ?? "UNASSIGNED";

            schedule.ScheduledTasks.Add(new ScheduledTaskDto
            {
                // IDs (for internal use) - Keep GUIDs for database operations
                VesselVisitId = vesselIdFromProlog,
                DockId = assignedDockId,
                StaffId = assignedStaff?.MecanographicNumber ?? "UNASSIGNED",
                ResourceId = requestedResourceCode,
                
                // Display names (for UI) - Show user-friendly values
                VesselVisitBusinessId = vesselBusinessId,
                DockName = dockDisplayName,
                ResourceKind = resourceDisplayKind,
                StaffShortName = staffDisplayName,
                
                StartTime = scheduledStart,
                EndTime = scheduledEnd
            });
        }

        // Recalculate total delay based on actual scheduled times (not Prolog's value)
        // because we may have adjusted schedules after Prolog's calculation
        schedule.TotalDelay = CalculateTotalDelayInHours(schedule.ScheduledTasks, clientVisits);
        _logger.LogInformation("[DIAG] Recalculated TotalDelay after scheduling adjustments: {TotalDelay} hours", schedule.TotalDelay);

        return Finish();
    }

    // Calculate total delay: sum of (actual end time - desired departure time) for all vessels
    private double CalculateTotalDelayInHours(List<ScheduledTaskDto> tasks, List<VesselVisitDto> visits)
    {
        double totalDelayHours = 0.0;
        
        foreach (var task in tasks)
        {
            // Find the corresponding vessel visit by BusinessId (not GUID Id)
            var visit = visits.FirstOrDefault(v => v.BusinessId.Equals(task.VesselVisitId, StringComparison.OrdinalIgnoreCase));
            if (visit == null) continue;
            
            // Calculate delay: if task ends after estimated departure, add the difference
            if (task.EndTime > visit.EstimatedDeparture)
            {
                var delay = task.EndTime - visit.EstimatedDeparture;
                totalDelayHours += delay.TotalHours;
                _logger.LogDebug("Vessel {VesselId} has {Delay}h delay (ends {End}, wanted {Departure})", 
                    task.VesselVisitId, delay.TotalHours, task.EndTime, visit.EstimatedDeparture);
            }
        }
        
        return totalDelayHours;
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
