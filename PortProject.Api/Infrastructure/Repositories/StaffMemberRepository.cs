using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain.QualificationAggregate;
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
    public async Task<IEnumerable<StaffMember>> GetAllAsync(string? nameFilter, StaffStatus? statusFilter, string? qualificationCode)
    {
        // Start with a base query
        var query = _context.StaffMembers
            .Include(sm => sm.Qualifications) // <-- Eager load Qualifications
            .AsQueryable();

        // Conditionally add filters
        if (!string.IsNullOrWhiteSpace(nameFilter))
        {
            query = query.Where(sm => sm.ShortName.Contains(nameFilter));
        }

        if (statusFilter.HasValue)
        {
            query = query.Where(sm => sm.CurrentStatus == statusFilter.Value);
        }
        
        // --- ADD THIS NEW FILTERING LOGIC ---
        if (!string.IsNullOrWhiteSpace(qualificationCode))
        {
            // Create the QualificationCode value object to ensure valid format
            QualificationCode qualCodeVo;
            try
            {
                qualCodeVo = new QualificationCode(qualificationCode);
            }
            catch (ArgumentException)
            {
                // If the provided code format is invalid, return an empty list
                // Or you could choose to throw an exception back up to the service/controller
                return new List<StaffMember>();
            }

            // Filter staff members where their Qualifications collection contains
            // any qualification whose Code matches the provided qualCodeVo.
            query = query.Where(sm => sm.Qualifications.Any(q => q.Code == qualCodeVo));
        }

        return await query.ToListAsync();
    }
}