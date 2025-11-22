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
    private readonly ILogger<SchedulingController> _logger;

    public SchedulingController(ISchedulingService schedulingService, ILogger<SchedulingController> logger)
    {
        _schedulingService = schedulingService;
        _logger = logger;
    }

    /// <summary>
    /// Generates a daily schedule for all pending vessel visits.
    /// (Implements US 3.4.2)
    /// </summary>
    [HttpPost("daily")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(DailyScheduleResponseDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> GetDailySchedule([FromBody] DailyScheduleRequestDto request)
    {
        try
        {
            _logger.LogInformation("Received scheduling request for date: {Date} using algorithm: {Algorithm}", 
                request.Date, request.Algorithm ?? "optimal");
            var schedule = await _schedulingService.GenerateDailySchedule(request.Date, request.Algorithm ?? "optimal");
            _logger.LogInformation("Successfully generated schedule with {TaskCount} tasks", schedule.ScheduledTasks.Count);
            return Ok(schedule);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating schedule for date {Date}", request.Date);
            return StatusCode(500, new ProblemDetails
            {
                Status = 500,
                Title = "Error generating schedule",
                Detail = ex.Message
            });
        }
    }
}