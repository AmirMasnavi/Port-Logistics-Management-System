using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;

namespace PortProject.Api.Application.ShippingAgentsRepresentative.Services
{
    public interface IShippingAgentRepresentativeService
    {
        Task<ShippingAgentRepresentative> CreateRepresentativeAsync(CreateShippingAgentRepresentativeDto dto);
        Task<ShippingAgentRepresentativeDto?> GetByIdAsync(string id);
        Task<IEnumerable<ShippingAgentRepresentativeDto>> GetAllAsync();
    Task<ShippingAgentRepresentativeDto?> UpdateRepresentativeAsync(string id, CreateShippingAgentRepresentativeDto dto);
        Task<ShippingAgentRepresentativeDto?> UpdateRepresentativeByCitizenIdAsync(string citizenId, CreateShippingAgentRepresentativeDto dto);
        Task<bool> DeleteRepresentativeAsync(string id);
        Task<bool> DeleteRepresentativeByCitizenIdAsync(string citizenId);
    Task<IEnumerable<ShippingAgentRepresentativeDto>> GetByOrganizationIdAsync(string organizationId);
    Task<IEnumerable<RepresentativeSimpleDto>> GetAllSimplifiedAsync();
    Task<IEnumerable<RepresentativeSimpleDto>> GetSimplifiedByOrganizationIdAsync(string organizationId);
    }
}

