
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;

namespace PortProject.Api.Application.ShippingAgentsOrganization.Services
{
    public interface IShippingAgentOrganizationService
    {
        Task<Guid> RegisterOrganizationAsync(CreateShippingAgentOrganizationDto dto, CancellationToken ct = default);
        Task<ShippingAgentOrganizationDto?> GetByIdAsync(Guid id, CancellationToken ct = default);
        Task<IEnumerable<ShippingAgentOrganizationDto>> GetAllAsync(CancellationToken ct = default);
        Task<ShippingAgentRepresentativeDto> AddRepresentativeToOrganizationAsync(string organizationId, CreateShippingAgentRepresentativeDto dto);
    }
}