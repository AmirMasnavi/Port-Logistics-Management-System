namespace PortProject.Api.Application.VesselVisitNotification.DTOs;

public class CreateVvnDto
{
    public DateTime EstimatedArrival { get; set; }
    public DateTime EstimatedDeparture { get; set; }
    public string VesselImo { get; set; }
    public CreateCargoDto Cargo { get; set; }
    public string RepresentativeId { get; set; }
}