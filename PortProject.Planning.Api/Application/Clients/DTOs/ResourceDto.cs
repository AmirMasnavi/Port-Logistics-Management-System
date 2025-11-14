namespace PortProject.Planning.Api.Application.Clients.DTOs;

public record ResourceDto(
    string Code, 
    string Kind, 
    string? AssignedArea, 
    string Status,
    string? OperationalWindowStart,
    string? OperationalWindowEnd,
    int? SetupTimeMinutes,
    List<string>? QualificationRequirements);