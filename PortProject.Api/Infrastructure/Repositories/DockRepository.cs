using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain.DockAggregate;
using PortProject.Api.Models;
using src.Domain.VesselTypeAggregate;

namespace PortProject.Api.Infrastructure.Repositories
{
    public class DockRepository : IDockRepository
    {
        private readonly PortProjectContext _context;
        private readonly DbSet<Dock> _set;

        public DockRepository(PortProjectContext context)
        {
            _context = context;
            _set = context.Docks;
        }

        public async Task<Dock> AddAsync(Dock entity)
        {
            await _set.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<Dock?> GetByIdAsync(DockId id)
        {
            return await _set.AsNoTracking().FirstOrDefaultAsync(d => d.Id.Value == id.Value);
        }

        public async Task<List<Dock>> GetByIdsAsync(List<DockId> ids)
        {
            var idValues = ids.Select(i => i.Value).ToList();
            return await _set.AsNoTracking().Where(d => idValues.Contains(d.Id.Value)).ToListAsync();
        }

        public async Task<Dock?> GetByNameAsync(DockName name)
        {
            return await _set.AsNoTracking().FirstOrDefaultAsync(d => d.Name.Value == name.Value);
        }

        public async Task<IEnumerable<Dock>> SearchByCriteriaAsync(string? name = null, string? location = null, VesselTypeId? vesselType = null)
        {
            IQueryable<Dock> query = _set;

            if (!string.IsNullOrWhiteSpace(name))
                query = query.Where(d => d.Name.Value.ToLower().Contains(name.ToLower()));

            if (!string.IsNullOrWhiteSpace(location))
                query = query.Where(d => d.Location.Zone.ToLower().Contains(location.ToLower()) || d.Location.Section.ToLower().Contains(location.ToLower()));

            if (vesselType != null)
                query = query.Where(d => d.AllowedVesselTypes.Any(v => v.Value == vesselType.Value));

            return await query.AsNoTracking().ToListAsync();
        }

        public async Task<List<Dock>> GetAllAsync()
        {
            return await _set.AsNoTracking().ToListAsync();
        }

        public async Task<Dock> UpdateAsync(Dock dock)
        {
            _set.Update(dock);
            await _context.SaveChangesAsync();
            return dock;
        }

        public async Task DeleteAsync(Dock dock)
        {
            _set.Remove(dock);
            await _context.SaveChangesAsync();
        }

        public void Remove(Dock dock)
        {
            _set.Remove(dock);
            _context.SaveChanges();
        }
    }
}
