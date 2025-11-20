using System.Threading.Tasks;
using System.Collections.Generic;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;

namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    public interface IShippingAgentRepresentativeRepository
    {
        Task AddAsync(ShippingAgentRepresentative representative);
        Task<ShippingAgentRepresentative?> GetByIdAsync(RepresentativeId id);
        Task<ShippingAgentRepresentative?> GetByCitizenIdAsync(CitizenId citizenId);
        Task<ShippingAgentRepresentative?> GetByEmailAsync(RepresentativeEmail email);
        Task<bool> ExistsByCitizenIdAsync(CitizenId citizenId);
        Task<bool> ExistsByEmailAsync(RepresentativeEmail email);
        Task<IEnumerable<ShippingAgentRepresentative>> GetAllAsync();
        Task<IEnumerable<ShippingAgentRepresentative>> GetByOrganizationIdAsync(OrganizationId organizationId);
        Task UpdateAsync(ShippingAgentRepresentative representative);
        Task DeleteAsync(ShippingAgentRepresentative representative);
    }
}
