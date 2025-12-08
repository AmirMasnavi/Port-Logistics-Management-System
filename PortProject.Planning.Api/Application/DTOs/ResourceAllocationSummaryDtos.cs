namespace PortProject.Planning.Api.Application.DTOs;

public enum ResourceType
{
    Crane,
    Dock,
    Staff
}

public record ResourceAllocationSummaryRequestDto(
    ResourceType ResourceType,
    string ResourceCode,
    DateTime PeriodStartUtc,
    DateTime PeriodEndUtc
);

public record ResourceAllocationSummaryResponseDto(
    ResourceType ResourceType,
    string ResourceCode,
    DateTime PeriodStartUtc,
    DateTime PeriodEndUtc,
    int TotalAllocatedMinutes,
    int OperationCount
);

// Minimal shape for saved operation plans fetched from core API
public record OperationPlanDto(
    string OperationId,
    string ResourceCode,
    string ResourceKind,
    DateTime AllocationStartUtc,
    DateTime AllocationEndUtc,
    bool IsSaved
);

