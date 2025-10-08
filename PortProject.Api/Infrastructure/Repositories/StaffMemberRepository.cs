using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain.StaffMemberAggregate;
using PortProject.Api.Models;


namespace PortProject.Api.Infrastructure.Repositories;


public class StaffMemberRepository : IStaffMemberRepository
{
    private readonly PortProjectContext _context;

    public StaffMemberRepository(PortProjectContext context)
    {
        _context = context;
    }

    public async Task AddAsync(StaffMember staffMember)
    {
        await _context.StaffMembers.AddAsync(staffMember);
    }

    public async Task<StaffMember?> GetByIdAsync(MecanographicNumber id)
    {
        // FindAsync is optimized for finding an entity by its primary key
        return await _context.StaffMembers.FindAsync(id);
    }
    public async Task<IEnumerable<StaffMember>> GetAllAsync(string? nameFilter, StaffStatus? statusFilter)
    {
        // Start with a base query
        var query = _context.StaffMembers.AsQueryable();

        // Conditionally add filters
        if (!string.IsNullOrWhiteSpace(nameFilter))
        {
            query = query.Where(sm => sm.ShortName.Contains(nameFilter));
        }

        if (statusFilter.HasValue)
        {
            query = query.Where(sm => sm.CurrentStatus == statusFilter.Value);
        }

        return await query.ToListAsync();
    }
}