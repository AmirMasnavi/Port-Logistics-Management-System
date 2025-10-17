// using Microsoft.EntityFrameworkCore;
// using PortProject.Api.Domain.VesselVisitNotificationAggregate;
// using PortProject.Api.Models;
//
// namespace PortProject.Api.Infrastructure.Repositories
// {
//     public class VesselVisitNotificationRepository : IVesselVisitNotificationRepository
//     {
//         private readonly PortProjectContext _context;
//         private readonly DbSet<VesselVisitNotification> _set;
//
//         public VesselVisitNotificationRepository(PortProjectContext context)
//         {
//             _context = context;
//             _set = context.VesselVisitNotifications;
//         }
//
//         public async Task<VesselVisitNotification> AddAsync(VesselVisitNotification entity)
//         {
//             await _set.AddAsync(entity);
//             await _context.SaveChangesAsync();
//             return entity;
//         }
//
//         public async Task<VesselVisitNotification?> GetByIdAsync(NotificationId id)
//         {
//             return await _set
//                 .Include(v => v.DecisionLog)
//                 .Include(v => v.Cargo)
//                 .Include(v => v.CrewMembers)
//                 .FirstOrDefaultAsync(v => v.Id.Value == id.Value);
//         }
//
//         public async Task<IEnumerable<VesselVisitNotification>> GetAllAsync()
//         {
//             return await _set
//                 .Include(v => v.DecisionLog)
//                 .Include(v => v.Cargo)
//                 .Include(v => v.CrewMembers)
//                 .ToListAsync();
//         }
//
//         public async Task<List<VesselVisitNotification>> GetByIdsAsync(List<NotificationId> ids)
//         {
//             var idValues = ids.Select(i => i.Value).ToList();
//             return await _set
//                 .Include(v => v.DecisionLog)
//                 .Include(v => v.Cargo)
//                 .Include(v => v.CrewMembers)
//                 .Where(v => idValues.Contains(v.Id.Value))
//                 .ToListAsync();
//         }
//
//         public async Task<IEnumerable<VesselVisitNotification>> GetByStatusAsync(NotificationStatus status)
//         {
//             return await _set
//                 .Include(v => v.DecisionLog)
//                 .Include(v => v.Cargo)
//                 .Include(v => v.CrewMembers)
//                 .Where(v => v.Status == status)
//                 .ToListAsync();
//         }
//
//         public async Task<VesselVisitNotification> UpdateAsync(VesselVisitNotification notification)
//         {
//             _set.Update(notification);
//             await _context.SaveChangesAsync();
//             return notification;
//         }
//
//         public async Task DeleteAsync(VesselVisitNotification entity)
//         {
//             _set.Remove(entity);
//             await _context.SaveChangesAsync();
//         }
//
//         public async Task<IEnumerable<VesselVisitNotification>> SearchByCriteriaAsync(string searchTerm)
//         {
//             if (string.IsNullOrWhiteSpace(searchTerm))
//                 return await GetAllAsync();
//
//             return await _set
//                 .Include(v => v.DecisionLog)
//                 .Include(v => v.Cargo)
//                 .Include(v => v.CrewMembers)
//                 .Where(v =>
//                     v.VesselId.Value.Contains(searchTerm) ||
//                     v.SubmittedBy.Value.Contains(searchTerm) ||
//                     v.Cargo.Description.Contains(searchTerm))
//                 .ToListAsync();
//         }
//     }
// }
