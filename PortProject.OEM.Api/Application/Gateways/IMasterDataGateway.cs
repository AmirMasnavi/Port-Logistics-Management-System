using PortProject.OEM.Api.Application.Dtos;

namespace PortProject.OEM.Api.Application.Gateways;

public interface IMasterDataGateway
{
    Task<VvnDto?> GetVvnAsync(string businessId);
}