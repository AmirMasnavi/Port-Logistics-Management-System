using PortProject.Planning.Api.Application.Clients.DTOs;

namespace PortProject.Planning.Api.Application.Clients;

/// <summary>
/// Implementation of the client that makes actual HTTP calls
/// to the main PortProject.Api.
/// </summary>
public class PortApiHttpClient : IPortApiHttpClient
{
    private readonly HttpClient _httpClient;

    public PortApiHttpClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IEnumerable<DockDto>> GetDocksAsync()
    {
        // Calls GET http://localhost:5273/api/Dock 
        return await _httpClient.GetFromJsonAsync<IEnumerable<DockDto>>("api/Dock") ?? [];
    }

    public async Task<IEnumerable<StaffMemberDto>> GetAvailableStaffAsync(DateOnly date)
    {
        // Calls GET http://localhost:5273/api/StaffMembers?status=Available 
        return await _httpClient.GetFromJsonAsync<IEnumerable<StaffMemberDto>>("api/StaffMembers?status=Available") ?? [];
        // Note: We can make this smarter later to filter by date.
    }

    // public async Task<IEnumerable<ResourceDto>> GetAvailableResourcesAsync(DateOnly date)
    // {
    //     // Calls GET http://localhost:5273/api/Resource?status=Active 
    //     return await _httpClient.GetFromJsonAsync<IEnumerable<ResourceDto>>("api/Resource?status=Active") ?? [];
    // }

    public async Task<IEnumerable<VesselVisitDto>> GetPendingVisitsAsync(DateOnly date)
    {
        // Calls GET http://localhost:5273/api/notifications/search?status=Submitted
        // We'll also filter by date.
        string dateString = date.ToString("yyyy-MM-dd");
        return await _httpClient.GetFromJsonAsync<IEnumerable<VesselVisitDto>>(
            $"api/notifications/search?status=Submitted&from={dateString}&to={dateString}") ?? [];
    }
}