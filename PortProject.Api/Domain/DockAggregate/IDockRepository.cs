using src.Domain.Shared;
using src.Domain.VesselTypeAggregate;

namespace PortProject.Api.Domain.DockAggregate
{
    public interface IDockRepository : IRepository<Dock, DockId>
    {
        Task<List<Dock>> GetByIdsAsync(List<DockId> ids);
        Task<List<Dock>> GetAllAsync();
        Task<Dock> UpdateAsync(Dock dock);
        Task DeleteAsync(Dock dock);
        Task<IEnumerable<Dock>> SearchByAdvancedCriteriaAsync(
            string? name = null,
            string? vesselTypeId = null,
            string? zone = null,
            string? section = null,
            int page = 1,
            int pageSize = 10,
            string? sortBy = "name",
            string? sortOrder = "asc"
        );
    }
}