using PortProject.Api.Application.VesselVisitNotification.DTOs;

namespace PortProject.Api.Application.VesselVisitNotification;

public interface IVesselVisitNotificationService
{
    // For US 2.2.8: Create a new notification
    Task<VesselVisitNotificationDto> CreateAsync(CreateVvnDto dto, string representativeId);

    // For US 2.2.9: Update an in-progress notification
    Task<VesselVisitNotificationDto> UpdateAsync(string notificationId, CreateVvnDto dto);

    // For US 2.2.8: Submit an in-progress notification
    Task SubmitAsync(string notificationId);
    
    // Helper method to retrieve a notification
    Task<VesselVisitNotificationDto?> GetByIdAsync(string notificationId);
}