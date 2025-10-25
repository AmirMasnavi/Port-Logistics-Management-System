namespace PortProject.Api.Application.StorageAreas.DTOs;

public class UpdateStorageAreaDto
{
    public string? Type { get; set; }
    public string? Location { get; set; }
    public int? Capacity { get; set; }
    public int? CurrentOccupancy { get; set; }
}