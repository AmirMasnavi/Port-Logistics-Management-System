using System.Threading.Tasks;
using System.Collections.Generic;

namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    public interface IShippingAgentRepresentativeRepository
    {
        Task AddAsync(ShippingAgentRepresentative representative);
        Task<ShippingAgentRepresentative?> GetByIdAsync(RepresentativeId id);
        Task<IEnumerable<ShippingAgentRepresentative>> GetAllAsync();
    }
}
