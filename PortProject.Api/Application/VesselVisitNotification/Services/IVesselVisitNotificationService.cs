using PortProject.Api.Application.VesselVisitNotification.DTOs;

namespace PortProject.Api.Application.VesselVisitNotification.Services
{
    public interface IVesselVisitNotificationService
    {
        // 🟢 US 2.2.8 — Criar nova notificação
        Task<VesselVisitNotificationDto> CreateAsync(CreateVvnDto dto, string representativeId);

        // 🟡 US 2.2.9 — Atualizar notificação em progresso
        Task<VesselVisitNotificationDto> UpdateAsync(string notificationId, CreateVvnDto dto);

        // 🟣 US 2.2.8 — Submeter notificação para decisão
        Task SubmitAsync(string notificationId);

        // 🔍 Auxiliar — Obter notificação por ID
        Task<VesselVisitNotificationDto?> GetByIdAsync(string notificationId);

        // ✅ US 2.2.7 — Aprovar notificação pendente
        Task<VesselVisitNotificationDto> ApproveAsync(string notificationId, ApproveVvnDto dto);

        // ❌ US 2.2.7 — Rejeitar notificação pendente
        Task<VesselVisitNotificationDto> RejectAsync(string notificationId, RejectVvnDto dto);

        // ♻️ Reabrir notificação rejeitada
        Task<VesselVisitNotificationDto?> ReopenAsync(string notificationId);

        // 🔎 Pesquisa avançada de notificações
        Task<List<VesselVisitNotificationDto>> SearchAsync(
            string? vesselImo,
            string? status,
            string? representativeId,
            string? organizationId,
            DateTime? from,
            DateTime? to
        );
    }
}