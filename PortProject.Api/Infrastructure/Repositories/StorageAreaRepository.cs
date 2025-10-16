using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain.StorageAggregate;
using PortProject.Api.Models;

namespace PortProject.Api.Infrastructure.Repositories;

public class StorageAreaRepository : IStorageAreaRepository
{
    private readonly PortProjectContext _context;
    
    public StorageAreaRepository(PortProjectContext context)
    {
        _context = context;
    }
    
    public async Task AddAsync(StorageArea storageArea)
    {
        await _context.StorageAreas.AddAsync(storageArea);
    }
    
    public async Task<StorageArea?> GetByIdAsync(StorageAreaId id)
    {
        return await _context.StorageAreas.Include(sa => sa.Location)
            .Include(sa => sa.Capacity).FirstOrDefaultAsync(sa => sa.Id == id);
    }
    
    
    public async Task<IEnumerable<StorageArea>> GetAllAsync(StorageAreaType? typeFilter, string? locationFilter)
    {
        var query = _context.StorageAreas.AsQueryable();
        
        if (typeFilter.HasValue)
        {
            query = query.Where(sa => sa.Type == typeFilter.Value);
        }
        
        if (!string.IsNullOrWhiteSpace(locationFilter))
        {
            query = query.Where(sa => sa.Location.ToString().Contains(locationFilter));
        }
        
        return await query.ToListAsync();
    }
}