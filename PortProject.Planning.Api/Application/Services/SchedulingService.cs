using PortProject.Planning.Api.Application.Clients;
using PortProject.Planning.Api.Application.DTOs;

namespace PortProject.Planning.Api.Application.Services;

/// <summary>
/// This service contains the "dummy" algorithm for US 3.4.1.
/// It fulfills AC 2 by consuming data from the PortApiHttpClient.
/// It fulfills AC 3 by not persisting any data.
/// </summary>
public class SchedulingService : ISchedulingService
{
    private readonly IPortApiHttpClient _portApiClient;

    public SchedulingService(IPortApiHttpClient portApiClient)
    {
        _portApiClient = portApiClient;
    }

    public async Task<DailyScheduleResponseDto> GenerateDailySchedule(DateOnly date)
    {
        // --- THIS FULFILLS THE USER STORY ---
        
        // 1. Consume data from the existing backend module (AC 2) 
        var docks = (await _portApiClient.GetDocksAsync()).ToList();
        var staff = (await _portApiClient.GetAvailableStaffAsync(date)).ToList();
        // var resources = (await _portApiClient.GetAvailableResourcesAsync(date)).ToList();
        var visits = (await _portApiClient.GetPendingVisitsAsync(date)).ToList();

        // 2. Run the "dummy" algorithm (AC 1)
        // This is just a placeholder. US 3.4.2 will make this smart.
        var schedule = new DailyScheduleResponseDto { Date = date };

        if (visits.Any() && docks.Any() && staff.Any() /*&& resources.Any()*/)
        {
            // Just schedule the first of everything to prove it works
            var firstVisit = visits.First();
            var firstDock = docks.First();
            // var firstCrane = resources.FirstOrDefault(r => r.Kind == "Crane");
            var firstOperator = staff.FirstOrDefault(s => s.QualificationCodes.Contains("CRANE_OPERATOR")); // Example
            
            if(/*firstCrane != null &&*/ firstOperator != null)
            {
                schedule.ScheduledTasks.Add(new ScheduledTaskDto
                {
                    VesselVisitId = firstVisit.Id.ToString(),
                    DockId = firstDock.Id,
                    // ResourceId = firstCrane.Code,
                    StaffId = firstOperator.MecanographicNumber,
                    StartTime = new DateTime(date, new TimeOnly(9, 0)),
                    EndTime = new DateTime(date, new TimeOnly(17, 0))
                });
            }
        }

        // 3. Return the result. This module does not save anything (AC 3)
        return schedule;
    }
}