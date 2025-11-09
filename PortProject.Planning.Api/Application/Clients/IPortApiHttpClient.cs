using PortProject.Planning.Api.Application.Clients.DTOs;

namespace PortProject.Planning.Api.Application.Clients;

/// <summary>
/// Defines the contract for a client that consumes data from the PortProject.Api via HTTP.
/// </summary>
public interface IPortApiHttpClient
{
    Task<IEnumerable<DockDto>> GetDocksAsync();
    Task<IEnumerable<StaffMemberDto>> GetAvailableStaffAsync(DateOnly date);
    // Task<IEnumerable<ResourceDto>> GetAvailableResourcesAsync(DateOnly date);
    Task<IEnumerable<VesselVisitDto>> GetPendingVisitsAsync(DateOnly date);
}