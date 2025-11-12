using System.Net.Http.Json;
using System.Linq;
using System.Text.Json;
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
        return await _httpClient.GetFromJsonAsync<IEnumerable<DockDto>>("/api/Dock") ?? Enumerable.Empty<DockDto>();
    }

    public async Task<IEnumerable<StaffMemberDto>> GetAvailableStaffAsync(DateOnly date)
    {
        // Calls GET http://localhost:5273/api/StaffMembers?status=Available 
        // Note: We can make this smarter later to filter by date.
        return await _httpClient.GetFromJsonAsync<IEnumerable<StaffMemberDto>>("/api/StaffMembers?status=Available") ?? Enumerable.Empty<StaffMemberDto>();
    }

    public async Task<IEnumerable<VesselVisitDto>> GetPendingVisitsAsync(DateOnly date)
    {
        // Calls GET http://localhost:5273/api/notifications/search?status=Submitted
        // We'll also filter by date. Use explicit from/to datetimes to avoid model-binding surprises.
        var fromDateTime = date.ToDateTime(new TimeOnly(0, 0));
        var toDateTime = date.ToDateTime(new TimeOnly(23, 59, 59));
        string fromString = Uri.EscapeDataString(fromDateTime.ToString("s")); // 2025-11-13T00:00:00
        string toString = Uri.EscapeDataString(toDateTime.ToString("s"));   // 2025-11-13T23:59:59

        var url = $"/api/notifications/search?status=Submitted&from={fromString}&to={toString}";

        var response = await _httpClient.GetAsync(url);
        var content = await response.Content.ReadAsStringAsync();

        // Log for diagnostics - helps to see what's returned by the main API
        Console.WriteLine($"[Planning] GET {url} -> {(int)response.StatusCode} {response.ReasonPhrase}");
        Console.WriteLine($"[Planning] Response Content: {content}");

        if (!response.IsSuccessStatusCode)
        {
            return Enumerable.Empty<VesselVisitDto>();
        }

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        try
        {
            var visits = JsonSerializer.Deserialize<IEnumerable<VesselVisitDto>>(content, options);
            return visits ?? Enumerable.Empty<VesselVisitDto>();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Planning] Failed to deserialize VesselVisitDto: {ex}");
            return Enumerable.Empty<VesselVisitDto>();
        }
    }
}