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
}