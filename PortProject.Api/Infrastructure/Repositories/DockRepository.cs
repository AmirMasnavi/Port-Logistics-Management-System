using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain.DockAggregate;
using PortProject.Api.Models;

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

        public Task<Dock?> GetByIdAsync(DockId id)
        {
            var dock = _set
                .AsNoTracking()
                .AsEnumerable()
                .FirstOrDefault(d => d.Id.Value == id.Value);

            return Task.FromResult(dock);
        }

        public async Task<List<Dock>> GetByIdsAsync(List<DockId> ids)
        {
            var idValues = ids.Select(i => i.Value).ToList();
            var allDocks = await _set.AsNoTracking().ToListAsync();
            return allDocks.Where(d => idValues.Contains(d.Id.Value)).ToList();
        }

        public async Task<Dock?> GetByNameAsync(DockName name)
        {
            var nameValue = name.Value.ToLower();
            return await _set.AsNoTracking().FirstOrDefaultAsync(d => d.Name.Value.ToLower() == nameValue);
        }

        public async Task<IEnumerable<Dock>> SearchByCriteriaAsync(string? name = null, string? vesselTypeId = null, string? zone = null,  string? section = null, int page = 1, int pageSize = 10, string? sortBy = "name", string? sortOrder = "asc")
        {
            IQueryable<Dock> query = _set;

            if (!string.IsNullOrWhiteSpace(name))
                query = query.Where(d => d.Name.Value.ToLower().Contains(name.ToLower()));

            if (!string.IsNullOrWhiteSpace(zone))
                query = query.Where(d => d.Location.Zone.ToLower().Contains(zone.ToLower()));

            if (!string.IsNullOrWhiteSpace(section))
                query = query.Where(d => d.Location.Section.ToLower().Contains(section.ToLower()));

            if (!string.IsNullOrWhiteSpace(vesselTypeId))
                query = query.Where(d => d.AllowedVesselTypes.Any(v => v.Value == vesselTypeId));

            // Sorting
            query = (sortBy?.ToLower(), sortOrder?.ToLower()) switch
            {
                ("name", "desc") => query.OrderByDescending(d => d.Name.Value),
                ("name", _) => query.OrderBy(d => d.Name.Value),
                _ => query.OrderBy(d => d.Name.Value),
            };

            // Pagination
            query = query.Skip((page - 1) * pageSize).Take(pageSize);

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
