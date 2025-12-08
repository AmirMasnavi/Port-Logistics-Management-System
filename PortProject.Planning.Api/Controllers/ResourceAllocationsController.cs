using Microsoft.AspNetCore.Mvc;
using PortProject.Planning.Api.Application.DTOs;
using PortProject.Planning.Api.Application.Services;
using System.Globalization;

namespace PortProject.Planning.Api.Controllers;

[ApiController]
[Route("api/planning/resource-allocations")]
[Produces("application/json")]
public class ResourceAllocationsController : ControllerBase
{
    private readonly IAllocationAggregationService _aggregationService;
    private readonly ILogger<ResourceAllocationsController> _logger;

    public ResourceAllocationsController(IAllocationAggregationService aggregationService, ILogger<ResourceAllocationsController> logger)
    {
        _aggregationService = aggregationService;
        _logger = logger;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(ResourceAllocationSummaryResponseDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    public async Task<IActionResult> GetSummary([FromQuery] ResourceType resourceType, [FromQuery] string resourceCode, [FromQuery] string periodStartUtc, [FromQuery] string periodEndUtc)
    {
        if (string.IsNullOrWhiteSpace(resourceCode) || string.IsNullOrWhiteSpace(periodStartUtc) || string.IsNullOrWhiteSpace(periodEndUtc))
        {
            return BadRequest(new ProblemDetails { Title = "Invalid request", Detail = "resourceCode, periodStartUtc and periodEndUtc are required" });
        }

        if (!DateTime.TryParse(periodStartUtc, null, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var start))
        {
            return BadRequest(new ProblemDetails { Title = "Invalid date", Detail = "periodStartUtc must be ISO-8601 (e.g., 2025-12-01T08:00:00Z)" });
        }
        if (!DateTime.TryParse(periodEndUtc, null, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out var end))
        {
            return BadRequest(new ProblemDetails { Title = "Invalid date", Detail = "periodEndUtc must be ISO-8601 (e.g., 2025-12-08T18:00:00Z)" });
        }

        try
        {
            var request = new ResourceAllocationSummaryRequestDto(resourceType, resourceCode, start.ToUniversalTime(), end.ToUniversalTime());
            var result = await _aggregationService.GetResourceAllocationSummaryAsync(request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Bad request for allocation summary");
            return BadRequest(new ProblemDetails { Title = "Invalid request", Detail = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error computing allocation summary");
            var zero = new ResourceAllocationSummaryResponseDto(resourceType, resourceCode, start.ToUniversalTime(), end.ToUniversalTime(), 0, 0);
            return Ok(zero);
        }
    }

    [HttpPost("summary")]
    [ProducesResponseType(typeof(ResourceAllocationSummaryResponseDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    public async Task<IActionResult> GetSummaryPost([FromBody] ResourceAllocationSummaryRequestDto body)
    {
        if (string.IsNullOrWhiteSpace(body.ResourceCode))
        {
            return BadRequest(new ProblemDetails { Title = "Invalid request", Detail = "resourceCode é obrigatório" });
        }
        var start = body.PeriodStartUtc.ToUniversalTime();
        var end = body.PeriodEndUtc.ToUniversalTime();
        if (end <= start)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid period", Detail = "periodEndUtc deve ser depois de periodStartUtc" });
        }
        try
        {
            var result = await _aggregationService.GetResourceAllocationSummaryAsync(new ResourceAllocationSummaryRequestDto(body.ResourceType, body.ResourceCode, start, end));
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error computing allocation summary (POST)");
            var zero = new ResourceAllocationSummaryResponseDto(body.ResourceType, body.ResourceCode, start, end, 0, 0);
            return Ok(zero);
        }
    }
}
