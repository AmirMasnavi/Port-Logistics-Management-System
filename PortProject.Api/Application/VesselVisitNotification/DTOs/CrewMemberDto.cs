namespace PortProject.Api.Application.VesselVisitNotification.DTOs;

public class CrewMemberDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Nationality { get; set; }
    public bool IsSafetyOfficer { get; set; }
}