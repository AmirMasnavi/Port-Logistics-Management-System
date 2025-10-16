namespace PortProject.Api.Application.VesselVisitNotification.DTOs;

public class CargoDto
{
    public string Description { get; set; }
    public double Weight { get; set; }
    public List<ContainerDto> Containers { get; set; }
}