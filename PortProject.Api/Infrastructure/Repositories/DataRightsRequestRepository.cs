using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain.DataRightsAggregate;
using PortProject.Api.Models;

namespace PortProject.Api.Infrastructure.Repositories;

public class DataRightsRequestRepository : IDataRightsRequestRepository
{
    private readonly PortProjectContext _context;

    public DataRightsRequestRepository(PortProjectContext context)
    {
        _context = context;
    }

    public async Task<DataRightsRequest> AddAsync(DataRightsRequest request)
    {
        await _context.DataRightsRequests.AddAsync(request);
        await _context.SaveChangesAsync();
        return request;
    }

    public async Task<DataRightsRequest?> GetByIdAsync(Guid id)
    {
        return await _context.DataRightsRequests.FindAsync(id);
    }

    public async Task<List<DataRightsRequest>> GetByUserEmailAsync(string email)
    {
        return await _context.DataRightsRequests
            .Where(r => r.UserEmail == email.ToLower())
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();
    }

    public async Task<List<DataRightsRequest>> GetAllAsync()
    {
        return await _context.DataRightsRequests
            .OrderByDescending(r => r.RequestedAt)
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
