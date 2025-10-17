namespace PortProject.Api.Application.VesselVisitNotification.DTOs;

public class DecisionLogEntryDto
{
    public DateTime Timestamp { get; set; }
    public string OfficerId { get; set; }
    public string Outcome { get; set; }
    public string? Reason { get; set; }
}