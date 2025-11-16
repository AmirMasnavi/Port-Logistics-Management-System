namespace PortProject.Api.Domain.VesselVisitNotificationAggregate
{
    public interface IVesselVisitNotificationRepository
    {
        /// <summary>
        /// Obtém uma notificação de visita de navio pelo seu identificador.
        /// </summary>
        Task<VesselVisitNotification?> GetByIdAsync(NotificationId id);

        /// <summary>
        /// Adiciona uma nova notificação de visita de navio ao repositório.
        /// </summary>
        Task AddAsync(VesselVisitNotification notification);

        /// <summary>
        /// Atualiza uma notificação de visita de navio existente.
        /// </summary>
        Task UpdateAsync(VesselVisitNotification notification);
        
        Task <VesselVisitNotification?> GetByBusinessIdAsync(string businessId);
        
    }
}