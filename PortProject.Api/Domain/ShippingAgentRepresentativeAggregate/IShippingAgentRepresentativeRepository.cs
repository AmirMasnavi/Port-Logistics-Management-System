using System.Threading.Tasks;
using System.Collections.Generic;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;

namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    public interface IShippingAgentRepresentativeRepository
    {
        Task AddAsync(ShippingAgentRepresentative representative);
        Task<ShippingAgentRepresentative?> GetByIdAsync(RepresentativeId id);
    Task<IEnumerable<ShippingAgentRepresentative>> GetAllAsync();
    Task<IEnumerable<ShippingAgentRepresentative>> GetByOrganizationIdAsync(OrganizationId organizationId);
    }
}
