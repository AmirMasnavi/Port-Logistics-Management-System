namespace PortProject.Planning.Api.Application.Clients.DTOs;

// A record to hold dock data fetched from PortProject.Api
// US 4.3.3: Added LengthInMeters and NumberOfSTSCranes for rebalancing algorithm
// Made fields nullable with defaults to handle cases where main API doesn't provide all fields
public record DockDto(
    string Id, 
    string Name, 
    double? LengthInMeters = null, 
    int? NumberOfSTSCranes = null
)
{
    // Provide sensible defaults for rebalancing
    public double EffectiveLengthInMeters => LengthInMeters ?? 300.0; // Default 300m dock
    public int EffectiveNumberOfSTSCranes => NumberOfSTSCranes ?? 2; // Default 2 cranes
};
