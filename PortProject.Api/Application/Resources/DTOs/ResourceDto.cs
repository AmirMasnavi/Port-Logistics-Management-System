namespace PortProject.Api.Application.Resources.DTOs;

public class ResourceDto
{
    public string Code { get; set; }
    public string Description { get; set; }
    public string Kind { get; set; }
    public string? AssignedArea { get; set; }
    public string Status { get; set; }
    public int SetupTimeMinutes { get; set; }
    public string OperationalWindowStart { get; set; }
    public string OperationalWindowEnd { get; set; }
    public List<string>? QualificationRequirements { get; set; }

    public int? AverageContainersPerHour { get; set; } // Crane
    public int? ContainersPerTrip { get; set; }        // Truck
    public double? AverageSpeedKmh { get; set; }       // Truck
    public string? OtherUnit { get; set; }             // Other
    public double? OtherGenericValue { get; set; }     // Other
}