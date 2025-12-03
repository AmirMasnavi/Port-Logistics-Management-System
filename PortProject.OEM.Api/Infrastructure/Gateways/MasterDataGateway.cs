using System.Net.Http.Json;
using PortProject.OEM.Api.Application.Gateways;
using PortProject.OEM.Api.Application.Dtos;

namespace PortProject.OEM.Api.Infrastructure.Gateways;

public class MasterDataGateway : IMasterDataGateway
{
    private readonly HttpClient _httpClient;

    public MasterDataGateway(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<VvnDto?> GetVvnAsync(string businessId)
    {
        try
        {
            // Calls the OLD backend: GET /api/notifications/{businessId}
            // "HttpCompletionOption.ResponseHeadersRead" is a small optimization
            var response = await _httpClient.GetAsync($"/api/notifications/{businessId}");

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[MasterDataGateway] Failed to get VVN {businessId}. Status: {response.StatusCode}");
                return null;
            }

            return await response.Content.ReadFromJsonAsync<VvnDto>();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MasterDataGateway] Error fetching VVN: {ex.Message}");
            return null;
        }
    }
}