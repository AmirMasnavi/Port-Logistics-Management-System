using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PortProject.Planning.Api.Application.Clients;
using PortProject.Planning.Api.Application.DTOs;

namespace PortProject.Planning.Api.Application.Services;

public class AllocationAggregationService : IAllocationAggregationService
{
    private readonly IPortApiHttpClient _portClient;

    public AllocationAggregationService(IPortApiHttpClient portClient)
    {
        _portClient = portClient;
    }

    public async Task<ResourceAllocationSummaryResponseDto> GetResourceAllocationSummaryAsync(ResourceAllocationSummaryRequestDto request)
    {
        if (request.PeriodEndUtc <= request.PeriodStartUtc)
            throw new ArgumentException("Period end must be after start");
        
        var plans = await _portClient.GetSavedOperationPlansAsync(request.PeriodStartUtc, request.PeriodEndUtc);
        
        // Filter by resource type and code, only saved
        var filtered = plans.Where(p => p.IsSaved 
                                        && string.Equals(p.ResourceCode, request.ResourceCode, StringComparison.OrdinalIgnoreCase)
                                        && string.Equals(p.ResourceKind, request.ResourceType.ToString(), StringComparison.OrdinalIgnoreCase));
        
        // Clip allocations to requested period and sum minutes; deduplicate operation IDs for count
        int totalMinutes = 0;
        var opIds = new HashSet<string>();
        foreach (var p in filtered)
        {
            var start = p.AllocationStartUtc < request.PeriodStartUtc ? request.PeriodStartUtc : p.AllocationStartUtc;
            var end = p.AllocationEndUtc > request.PeriodEndUtc ? request.PeriodEndUtc : p.AllocationEndUtc;
            if (end > start)
            {
                totalMinutes += (int)Math.Round((end - start).TotalMinutes);
                opIds.Add(p.OperationId);
            }
        }
        
        return new ResourceAllocationSummaryResponseDto(
            request.ResourceType,
            request.ResourceCode,
            request.PeriodStartUtc,
            request.PeriodEndUtc,
            totalMinutes,
            opIds.Count);
    }
}
