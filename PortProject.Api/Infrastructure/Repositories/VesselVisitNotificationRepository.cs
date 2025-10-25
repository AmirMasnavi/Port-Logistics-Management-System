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
        return await _context.VesselVisitNotifications
            .Include(v => v.Cargo).ThenInclude(c => c.Containers)
            .Include(v => v.CrewMembers)
            .Include(v => v.DecisionLog)
            .FirstOrDefaultAsync(v => v.Id == id);
    }

    public Task UpdateAsync(VesselVisitNotification notification)
    {
        // EF Core's change tracker handles updates automatically
        // when SaveChangesAsync is called, so this method can be empty.
        _context.VesselVisitNotifications.Update(notification);
        return Task.CompletedTask;
    }
}