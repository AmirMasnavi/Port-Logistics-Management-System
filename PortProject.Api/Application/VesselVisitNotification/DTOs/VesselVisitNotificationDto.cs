namespace PortProject.Api.Application.VesselVisitNotification.DTOs;

public class VesselVisitNotificationDto
{
    public Guid Id { get; set; }
    public string Status { get; set; }
    public DateTime EstimatedArrival { get; set; }
    public DateTime EstimatedDeparture { get; set; }
    public string VesselImo { get; set; }
    public Guid SubmittedBy { get; set; }
    public String? AssignedDockId { get; set; }
    public CargoDto Cargo { get; set; }
    public List<CrewMemberDto> CrewMembers { get; set; }
    public List<DecisionLogEntryDto> DecisionLog { get; set; }
}