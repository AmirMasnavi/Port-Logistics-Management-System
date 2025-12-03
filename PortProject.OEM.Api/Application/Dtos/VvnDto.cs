namespace PortProject.OEM.Api.Application.Dtos;

public class VvnDto
{
    public string BusinessId { get; set; } = string.Empty;
    public string VesselImo { get; set; } = string.Empty;
    public DateTime EstimatedArrival { get; set; }
    public DateTime EstimatedDeparture { get; set; }
    public string Status { get; set; } = string.Empty;
}