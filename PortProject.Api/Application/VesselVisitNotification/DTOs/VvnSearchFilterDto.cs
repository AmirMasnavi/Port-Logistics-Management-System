namespace PortProject.Api.Application.VesselVisitNotification.DTOs;

public class VvnSearchFilterDto
{
    public string? VesselImo { get; set; }
    public string? Status { get; set; }
    public string? RepresentativeId { get; set; }
    public string? OrganizationId { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}
