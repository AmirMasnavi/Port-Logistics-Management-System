namespace PortProject.Api.Application.VesselVisitNotification.DTOs;

public class VesselVisitNotificationDto
{
    public string BusinessId { get; set; }
    public string Status { get; set; }
    public DateTime EstimatedArrival { get; set; }
    public DateTime EstimatedDeparture { get; set; }
    public string VesselImo { get; set; }
    public string SubmittedBy { get; set; }
    public String? AssignedDockId { get; set; }
    public CargoDto Cargo { get; set; }
    public List<CrewMemberDto> CrewMembers { get; set; }
    public List<DecisionLogEntryDto> DecisionLog { get; set; }
    public double UnloadingTime => Cargo?.Weight / 1000 ?? 0; // Exemplo: 1 hora por cada 1000kg
    public double LoadingTime => Cargo?.Weight / 1000 ?? 0; // Exemplo: o mesmo tempo para carregar
}