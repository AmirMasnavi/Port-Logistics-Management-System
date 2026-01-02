using PortProject.Planning.Api.Application.DTOs;

namespace PortProject.Planning.Api.Application.Services;

/// <summary>
/// Contract for the planning service that generates schedules.
/// </summary>
public interface ISchedulingService
{
    Task<DailyScheduleResponseDto> GenerateDailySchedule(DateOnly date, string algorithm, GeneticAlgorithmParamsDto? geneticParams = null, RebalancingAlgorithmParamsDto? rebalancingParams =  null);
    /// <summary>
    /// US 4.3.3: Generates a rebalancing proposal comparing baseline vs proposed allocation
    /// </summary>
    Task<RebalancingProposalDto> GenerateRebalancingProposal(
        DateOnly date,
        RebalancingAlgorithmParamsDto parameters);

    /// <summary>
    /// US 4.3.3: Confirms a rebalancing proposal
    /// </summary>
    Task ConfirmRebalancing(
        string proposalId,
        string officerId,
        string? comments = null);
}