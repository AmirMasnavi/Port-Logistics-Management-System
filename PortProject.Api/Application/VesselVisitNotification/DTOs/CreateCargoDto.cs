namespace PortProject.Api.Application.VesselVisitNotification.DTOs;

public class CreateCargoDto
{
    public string Description { get; set; }
    public double Weight { get; set; }
    public List<CreateContainerDto> Containers { get; set; }
}