using PortProject.Api.Application.VesselVisitNotification.DTOs;

namespace PortProject.Api.Application.VesselVisitNotification.Services;

public interface IVesselVisitNotificationService
{
    // US 2.2.8: Criar nova notificação
    Task<VesselVisitNotificationDto> CreateAsync(CreateVvnDto dto, string representativeId);

    // US 2.2.9: Atualizar notificação em progresso
    Task<VesselVisitNotificationDto> UpdateAsync(string notificationId, CreateVvnDto dto);

    // US 2.2.8: Submeter notificação
    Task SubmitAsync(string notificationId);

    // Auxiliar: Obter notificação por ID
    Task<VesselVisitNotificationDto?> GetByIdAsync(string notificationId);

    // US 2.2.7: Aprovar notificação
    Task ApproveAsync(string notificationId, string officerId, string dockId);

    // US 2.2.7: Rejeitar notificação
    Task RejectAsync(string notificationId, string officerId, string reason);
    
    Task<List<VesselVisitNotificationDto>> SearchAsync(string? vesselImo, string? status, string? representativeId, string? organizationId, DateTime? from, DateTime? to);

}
