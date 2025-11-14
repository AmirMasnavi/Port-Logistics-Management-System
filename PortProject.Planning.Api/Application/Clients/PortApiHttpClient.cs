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
        // Calls GET http://localhost:5273/api/StaffMembers
        // Note: previous implementation filtered by status in the query string which may cause model-binding 400 errors
        // if the main API doesn't accept that exact string. We'll request all and let SchedulingService filter if needed.
        try
        {
            return await _httpClient.GetFromJsonAsync<IEnumerable<StaffMemberDto>>("/api/StaffMembers") ?? Enumerable.Empty<StaffMemberDto>();
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"[Planning] Failed to get staff members: {ex.Message}");
            return Enumerable.Empty<StaffMemberDto>();
        }
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

    public async Task<IEnumerable<ResourceDto>> GetResourcesAsync(DateOnly date)
    {
        // Calls GET http://localhost:5273/api/Resource?status=Available
        // The main API supports filtering by status; we'll request available resources.
        var url = "/api/Resource?status=Available";
        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
        {
            Console.WriteLine($"[Planning] GET {url} -> {(int)response.StatusCode} {response.ReasonPhrase}");
            // Try a fallback to fetch any resources without status filter
            try
            {
                var fallbackUrl = "/api/Resource";
                var fallbackResp = await _httpClient.GetAsync(fallbackUrl);
                if (!fallbackResp.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[Planning] Fallback GET {fallbackUrl} -> {(int)fallbackResp.StatusCode} {fallbackResp.ReasonPhrase}");
                    return Enumerable.Empty<ResourceDto>();
                }

                var fallbackContent = await fallbackResp.Content.ReadAsStringAsync();
                var fallbackOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var fallbackResources = JsonSerializer.Deserialize<IEnumerable<ResourceDto>>(fallbackContent, fallbackOptions);
                return fallbackResources ?? Enumerable.Empty<ResourceDto>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Planning] Failed to fetch resources fallback: {ex}");
                return Enumerable.Empty<ResourceDto>();
            }
        }

        var content = await response.Content.ReadAsStringAsync();
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        try
        {
            var resources = JsonSerializer.Deserialize<IEnumerable<ResourceDto>>(content, options);
            // If the API returned an empty list for the filtered query, attempt a fallback to get all resources
            if (resources == null || !resources.Any())
            {
                var fallbackUrl = "/api/Resource";
                var fallbackResp = await _httpClient.GetAsync(fallbackUrl);
                if (fallbackResp.IsSuccessStatusCode)
                {
                    var fallbackContent = await fallbackResp.Content.ReadAsStringAsync();
                    var fallbackOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var fallbackResources = JsonSerializer.Deserialize<IEnumerable<ResourceDto>>(fallbackContent, fallbackOptions);
                    return fallbackResources ?? Enumerable.Empty<ResourceDto>();
                }
            }

            return resources ?? Enumerable.Empty<ResourceDto>();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Planning] Failed to deserialize ResourceDto: {ex}");
            return Enumerable.Empty<ResourceDto>();
        }
    }

    // New: fetch staff by qualification code using the main API's query parameter
    public async Task<IEnumerable<StaffMemberDto>> GetStaffByQualificationAsync(string qualificationCode)
    {
        if (string.IsNullOrWhiteSpace(qualificationCode)) return Enumerable.Empty<StaffMemberDto>();
        try
        {
            var url = $"/api/StaffMembers?qualificationCode={Uri.EscapeDataString(qualificationCode)}";
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[Planning] GET {url} -> {(int)response.StatusCode} {response.ReasonPhrase}");
                return Enumerable.Empty<StaffMemberDto>();
            }

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            try
            {
                var staff = JsonSerializer.Deserialize<IEnumerable<StaffMemberDto>>(content, options);
                return staff ?? Enumerable.Empty<StaffMemberDto>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Planning] Failed to deserialize StaffMemberDto for qualification {qualificationCode}: {ex}");
                return Enumerable.Empty<StaffMemberDto>();
            }
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"[Planning] Failed to GET staff by qualification {qualificationCode}: {ex.Message}");
            return Enumerable.Empty<StaffMemberDto>();
        }
    }
}