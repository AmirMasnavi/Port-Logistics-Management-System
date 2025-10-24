namespace PortProject.Api.Application.VesselVisitNotification.DTOs;

public class CreateCrewMemberDto
{
    public string Name { get; set; }
    public string Nationality { get; set; }
    public bool IsSafetyOfficer { get; set; } = false; // Default to false
}