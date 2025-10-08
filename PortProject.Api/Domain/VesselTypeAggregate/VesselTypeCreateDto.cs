namespace PortProject.Api.Domain.VesselTypeAggregate;

public class VesselTypeCreateDto
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public int Capacity { get; set; }
    public int MaxRows { get; set; }
    public int MaxBays { get; set; }
    public int MaxTiers { get; set; }
}