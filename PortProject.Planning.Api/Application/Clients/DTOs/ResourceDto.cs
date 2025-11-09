namespace PortProject.Planning.Api.Application.Clients.DTOs;

public record ResourceDto(
    string Code, 
    string Kind, 
    string? AssignedArea, 
    List<string>? QualificationRequirements);