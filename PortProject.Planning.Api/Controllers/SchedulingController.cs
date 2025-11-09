using Microsoft.AspNetCore.Mvc;
using PortProject.Planning.Api.Application.DTOs;
using PortProject.Planning.Api.Application.Services;

namespace PortProject.Planning.Api.Controllers;

/// <summary>
/// This is the REST API for the Planning & Scheduling module.
/// It computes results and does not persist data.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SchedulingController : ControllerBase
{
    private readonly ISchedulingService _schedulingService;

    public SchedulingController(ISchedulingService schedulingService)
    {
        _schedulingService = schedulingService;
    }

    /// <summary>
    /// Generates a daily schedule for all pending vessel visits.
    /// (Implements US 3.4.2)
    /// </summary>
    [HttpPost("daily")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(DailyScheduleResponseDto), 200)]
    public async Task<IActionResult> GetDailySchedule([FromBody] DailyScheduleRequestDto request)
    {
        var schedule = await _schedulingService.GenerateDailySchedule(request.Date);
        return Ok(schedule);
    }
}