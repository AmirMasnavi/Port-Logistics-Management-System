namespace PortProject.Planning.Api.Application.Clients.DTOs;

public record VesselVisitDto(
    Guid Id,
    string BusinessId,
    string Status, 
    DateTime EstimatedArrival, 
    DateTime EstimatedDeparture, 
    string VesselImo,
    double UnloadingTime,
    double LoadingTime,
    Guid? AssignedDockId,  // Match the main API field name
    string? AssignedDockName  // Match the main API field name
    )
{
    // Add computed properties for backward compatibility
    public Guid DockId => AssignedDockId ?? Guid.Empty;
    public string? DockName => AssignedDockName;
}
