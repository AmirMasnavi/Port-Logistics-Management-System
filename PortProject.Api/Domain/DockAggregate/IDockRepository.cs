using src.Domain.Shared;
using src.Domain.VesselTypeAggregate;

namespace PortProject.Api.Domain.DockAggregate
{
    public interface IDockRepository : IRepository<Dock, DockId>
    {
        Task<List<Dock>> GetByIdsAsync(List<DockId> ids);
        Task<IEnumerable<Dock>> SearchByCriteriaAsync(string? name = null, string? location = null, VesselTypeId? vesselType = null);
        Task<List<Dock>> GetAllAsync();
        Task<Dock> UpdateAsync(Dock dock);
        Task DeleteAsync(Dock dock);
    }
}