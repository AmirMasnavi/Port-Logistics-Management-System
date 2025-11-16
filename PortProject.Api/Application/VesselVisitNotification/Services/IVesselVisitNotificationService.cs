using PortProject.Api.Application.VesselVisitNotification.DTOs;

namespace PortProject.Api.Application.VesselVisitNotification.Services
{
    public interface IVesselVisitNotificationService
    {
        // 🟢 US 2.2.8 — Criar nova notificação
        Task<VesselVisitNotificationDto> CreateAsync(CreateVvnDto dto, string representativeId);

        // 🟡 US 2.2.9 — Atualizar notificação em progresso
        Task<VesselVisitNotificationDto> UpdateAsync(string businessId, CreateVvnDto dto);

        // 🟣 US 2.2.8 — Submeter notificação para decisão
        Task SubmitAsync(string businessId);

        // 🔍 Auxiliar — Obter notificação por ID
        Task<VesselVisitNotificationDto?> GetByBusinessIdAsync(string businessId);

        // ✅ US 2.2.7 — Aprovar notificação pendente
        Task<VesselVisitNotificationDto> ApproveAsync(string businessId, ApproveVvnDto dto);

        // ❌ US 2.2.7 — Rejeitar notificação pendente
        Task<VesselVisitNotificationDto> RejectAsync(string businessId, RejectVvnDto dto);

        // ♻️ Reabrir notificação rejeitada
        Task ReopenAsync(string businessId);

        // 🔎 Pesquisa avançada de notificações
        Task<List<VesselVisitNotificationDto>> SearchAsync(
            string? vesselImo,
            string? status,
            string? representativeId,
            DateTime? from,
            DateTime? to
        );
        
        Task<List<VesselVisitNotificationDto>> GetNotificationsForRepresentativeAsync(VvnSearchFilterDto filter);

    }
}