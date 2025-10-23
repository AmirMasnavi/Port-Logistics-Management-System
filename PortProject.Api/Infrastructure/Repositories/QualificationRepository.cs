using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain.QualificationAggregate;
using PortProject.Api.Models;

namespace PortProject.Api.Infrastructure.Repositories;

public class QualificationRepository : IQualificationRepository
{
    private readonly PortProjectContext _context;

    public QualificationRepository(PortProjectContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Qualification qualification)
    {
        await _context.Qualifications.AddAsync(qualification);
    }

    public async Task<Qualification?> GetByCodeAsync(QualificationCode code)
    {
        // Since Code is a Value Object, we need to compare its Value property
        return await _context.Qualifications.FirstOrDefaultAsync(q => q.Code == code);
    }

    public async Task<IEnumerable<Qualification>> GetAllAsync()
    {
        return await _context.Qualifications.ToListAsync();
    }
    
    public Task UpdateAsync(Qualification qualification)
    {
        // Mark the entity as modified. EF Core will generate the UPDATE statement
        // when SaveChangesAsync is called in the service.
        _context.Entry(qualification).State = EntityState.Modified;
        // No SaveChangesAsync here; the service/unit of work handles that.
        return Task.CompletedTask;
    }
}