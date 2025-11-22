namespace PortProject.Planning.Api.Application.Clients.DTOs;

public record StaffMemberDto(
    string MecanographicNumber,
    string ShortName,
    string OperationalWindow, 
    List<string> QualificationCodes);