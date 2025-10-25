namespace PortProject.Api.Application.Dock.DTOs;

public class DockCreateDto
{
    public string Id { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string LocationZone { get; set; } = default!;
    public string LocationSection { get; set; } = default!;
    public double LengthInMeters { get; set; }
    public double DepthInMeters { get; set; }
    public double MaxDraftInMeters { get; set; }
    public int NumberOfSTSCranes { get; set; }
    public List<string> AllowedVesselTypeIds { get; set; } = new();
}