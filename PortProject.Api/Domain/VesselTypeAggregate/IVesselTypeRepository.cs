using src.Domain.Shared;
using src.Domain.VesselTypeAggregate;

namespace PortProject.Api.Domain.VesselTypeAggregate
{
    public interface IVesselTypeRepository : IRepository<VesselType, VesselTypeId>
    {
        Task<VesselType> GetByNameAsync(VesselTypeName name);
        Task<IEnumerable<VesselType>> SearchByCriteriaAsync(string? searchTerm = null);
        Task<VesselType> UpdateAsync(VesselType vesselType);
        Task DeleteAsync(VesselType vesselType);
    }

   
}