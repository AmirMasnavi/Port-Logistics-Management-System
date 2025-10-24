namespace PortProject.Api.Application.Resources.DTOs;
    
public class EditResourceDto
{
    public string? Description { get; set; }
    
    // Crane-specific operational capacity
    public int? AverageContainersPerHour { get; set; }
    
    // Truck-specific operational capacity
    public int? ContainersPerTrip { get; set; }
    public double? AverageSpeedKmh { get; set; }
    
    // Other-specific operational capacity
    public string? OtherUnit { get; set; }
    public double? OtherGenericValue { get; set; }
    
    public string? AssignedArea { get; set; }
    public List<string>? QualificationRequirements { get; set; }
    public string? Status { get; set; }
}
