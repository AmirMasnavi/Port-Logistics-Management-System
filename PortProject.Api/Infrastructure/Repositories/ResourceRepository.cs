using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain.ResourceAggregate;
using PortProject.Api.Models;

namespace PortProject.Api.Infrastructure.Repositories;

public class ResourceRepository : IResourceRepository
{
    private readonly PortProjectContext _context;
    
    public ResourceRepository(PortProjectContext context)
    {
        _context = context;
    }
    
    public async Task AddAsync(Resource resource)
    {
        await _context.Resources.AddAsync(resource);
    }
    
    public async Task<Resource?> GetByIdAsync(ResourceCode code)
    {
        return await _context.Resources
            .Include(r => r.Qualifications)
            .FirstOrDefaultAsync(r => r.Code == code);
    }
    
    
    public async Task<IEnumerable<Resource>> GetAllAsync(ResourceKind? typeFilter)
    {
        var query = _context.Resources.AsQueryable();
        
        if (typeFilter.HasValue)
        {
            query = query.Where(r => r.Kind == typeFilter.Value);
        }
        
        return await query.ToListAsync();
    }
}