using System.Collections.Generic;
using System.Threading.Tasks;
using PortProject.Api.Domain.VesselTypeAggregate;

namespace PortProject.Api.Domain.VesselAggregate
{
    public interface IVesselRepository
    {
        Task<Vessel?> GetByImoAsync(ImoNumber imoNumber);
        Task<IEnumerable<Vessel>> SearchByCriteriaAsync(string? imo = null, string? name = null, string? operatorName = null);
        Task AddAsync(Vessel vessel);
        Task<Vessel> UpdateAsync(Vessel vessel);
        Task DeleteAsync(Vessel vessel);
    }
}