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
    /// Supports 'algorithm' parameter for UI selection (optimal/heuristic/genetic/rebalancing).
    /// (Implements US 3.4.2 and US 4.3.3 when algorithm = rebalancing)
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
            
            // Log genetic parameters if provided
            if (request.Algorithm == "genetic" && request.GeneticParams != null)
            {
                _logger.LogInformation("Genetic Algorithm Parameters - PopSize: {PopSize}, Generations: {Gens}, MutationRate: {Mut}, Time: {Time}s, CraneMode: {Mode}",
                    request.GeneticParams.PopulationSize,
                    request.GeneticParams.Generations,
                    request.GeneticParams.MutationRate,
                    request.GeneticParams.DesiredTimeSeconds,
                    request.GeneticParams.CraneMode);
            }
            
            // Log rebalancing parameters if provided (mirror genetic example)
            if (string.Equals(request.Algorithm, "rebalancing", StringComparison.OrdinalIgnoreCase) && request.RebalancingParams != null)
            {
                var p = request.RebalancingParams;
                _logger.LogInformation("[US 4.3.3] Rebalancing Params - DepartureWeight: {Dep}, DockWeight: {Dock}, CraneWeight: {Crane}, MaxIters: {Iters}, Time: {Time}s, EnforceConstraints: {Enforce}, Variant: {Variant}",
                    p.ExpectedDepartureDelaysWeight,
                    p.DockCapacityAndCongestionWeight,
                    p.CraneAvailabilityWeight,
                    p.MaxIterations,
                    p.DesiredTimeSeconds,
                    p.EnforceVesselAndDockConstraints,
                    p.Variant);
            }
            
            var schedule = await _schedulingService.GenerateDailySchedule(
                request.Date, 
                request.Algorithm ?? "optimal",
                request.GeneticParams,
                request.RebalancingParams);
            
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
    
    
    /// <summary>
    /// US 4.3.3: Generates a rebalancing proposal comparing baseline vs proposed allocation
    /// </summary>
    [HttpPost("rebalance/proposal")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(RebalancingProposalDto), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 400)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> GenerateRebalancingProposal([FromBody] DailyScheduleRequestDto request)
    {
        try
        {
            _logger.LogInformation("[US 4.3.3] Generating rebalancing proposal for date: {Date}", request.Date);
            
            if (request.RebalancingParams == null)
            {
                return BadRequest(new ProblemDetails
                {
                    Status = 400,
                    Title = "Invalid request",
                    Detail = "RebalancingParams are required for rebalancing proposal"
                });
            }
            
            var proposal = await _schedulingService.GenerateRebalancingProposal(
                request.Date,
                request.RebalancingParams ?? new RebalancingAlgorithmParamsDto());
            
            _logger.LogInformation("[US 4.3.3] Proposal generated - Baseline delay: {Baseline}h, Proposed delay: {Proposed}h",
                proposal.TotalDelayBaseline, proposal.TotalDelayProposed);
            
            return Ok(proposal);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[US 4.3.3] Error generating rebalancing proposal for date {Date}", request.Date);
            return StatusCode(500, new ProblemDetails
            {
                Status = 500,
                Title = "Error generating rebalancing proposal",
                Detail = ex.Message
            });
        }
    }
    /// <summary>
        /// US 4.3.3: Confirms a rebalancing proposal
        /// </summary>
        [HttpPost("rebalance/confirm")]
        [Produces("application/json")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(ProblemDetails), 400)]
        [ProducesResponseType(typeof(ProblemDetails), 500)]
        public async Task<IActionResult> ConfirmRebalancing([FromBody] RebalancingConfirmRequestDto request)
        {
            try
            {
                _logger.LogInformation("[US 4.3.3] Confirming rebalancing proposal {ProposalId} by officer {OfficerId}",
                    request.ProposalId, request.OfficerId);
                
                if (string.IsNullOrWhiteSpace(request.ProposalId) || string.IsNullOrWhiteSpace(request.OfficerId))
                {
                    return BadRequest(new ProblemDetails
                    {
                        Status = 400,
                        Title = "Invalid request",
                        Detail = "ProposalId and OfficerId are required"
                    });
                }
                
                await _schedulingService.ConfirmRebalancing(
                    request.ProposalId,
                    request.OfficerId,
                    request.OfficerName,
                    request.PlanId,
                    request.Comments);
                _logger.LogInformation("[US 4.3.3] Rebalancing proposal {ProposalId} confirmed successfully", request.ProposalId);
            
                return Ok(new
                {
                    proposalId = request.ProposalId,
                    officerId = request.OfficerId,
                    officerName = request.OfficerName,
                    planId = request.PlanId,
                    timestamp = DateTime.UtcNow,
                    comments = request.Comments
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[US 4.3.3] Error confirming rebalancing proposal {ProposalId}", request.ProposalId);
                return StatusCode(500, new ProblemDetails
                {
                    Status = 500,
                    Title = "Error confirming rebalancing",
                    Detail = ex.Message
                });
            }
        }

        /// <summary>
    /// US 4.3.3: Retrieves rebalancing audit logs
    /// </summary>
    [HttpGet("rebalance/audit")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(IEnumerable<object>), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 500)]
    public async Task<IActionResult> GetRebalancingAuditLogs()
    {
        try
        {
            var logs = await _schedulingService.GetRebalancingAuditLogs();
            return Ok(logs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[US 4.3.3] Error retrieving audit logs");
            return StatusCode(500, new ProblemDetails
            {
                Status = 500,
                Title = "Error retrieving audit logs",
                Detail = ex.Message
            });
        }
    }
}
