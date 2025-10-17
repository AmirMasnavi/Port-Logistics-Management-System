namespace PortProject.Api.Domain.VesselVisitNotificationAggregate;

public interface IVesselVisitNotificationRepository
{
    Task AddAsync(VesselVisitNotification notification);
    Task<VesselVisitNotification?> GetByIdAsync(NotificationId id);
    Task UpdateAsync(VesselVisitNotification notification);
}