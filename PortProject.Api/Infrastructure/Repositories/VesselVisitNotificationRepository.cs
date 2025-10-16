using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using PortProject.Api.Models;

namespace PortProject.Api.Infrastructure.Repositories;

public class VesselVisitNotificationRepository : IVesselVisitNotificationRepository
{
    private readonly PortProjectContext _context;

    public VesselVisitNotificationRepository(PortProjectContext context)
    {
        _context = context;
    }

    public async Task AddAsync(VesselVisitNotification notification)
    {
        await _context.VesselVisitNotifications.AddAsync(notification);
    }

    public async Task<VesselVisitNotification?> GetByIdAsync(NotificationId id)
    {
        // Use Include to load related owned entities
        return await _context.VesselVisitNotifications
            .Include(vvn => vvn.Cargo)
            .ThenInclude(c => c.Containers)
            .Include(vvn => vvn.CrewMembers)
            .Include(vvn => vvn.DecisionLog)
            .FirstOrDefaultAsync(vvn => vvn.Id == id);
    }
    
    public Task UpdateAsync(VesselVisitNotification notification)
    {
        // EF Core's change tracker handles updates automatically
        // when SaveChangesAsync is called, so this method can be empty.
        _context.VesselVisitNotifications.Update(notification);
        return Task.CompletedTask;
    }
}