using PortProject.Planning.Api.Application.DTOs;

namespace PortProject.Planning.Api.Application.Services;

/// <summary>
/// Contract for the planning service that generates schedules.
/// </summary>
public interface ISchedulingService
{
    Task<DailyScheduleResponseDto> GenerateDailySchedule(DateOnly date, string algorithm, GeneticAlgorithmParamsDto? geneticParams = null);
}