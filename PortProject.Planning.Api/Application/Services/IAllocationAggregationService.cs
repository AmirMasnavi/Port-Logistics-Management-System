using PortProject.Planning.Api.Application.DTOs;

namespace PortProject.Planning.Api.Application.Services;

public interface IAllocationAggregationService
{
    Task<ResourceAllocationSummaryResponseDto> GetResourceAllocationSummaryAsync(ResourceAllocationSummaryRequestDto request);
}
