using PortProject.Api.Application.VesselVisitNotification.DTOs;
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using PortProject.Api.Models;

namespace PortProject.Api.Application.VesselVisitNotification.Services;

public class VesselVisitNotificationService : IVesselVisitNotificationService
{
    private readonly IVesselVisitNotificationRepository _vvnRepo;
    private readonly PortProjectContext _context;

    public VesselVisitNotificationService(IVesselVisitNotificationRepository vvnRepo, PortProjectContext context)
    {
        _vvnRepo = vvnRepo;
        _context = context;
    }

    public async Task<VesselVisitNotificationDto> CreateAsync(CreateVvnDto dto, string representativeId)
    {
        // 1. Convert DTOs to Domain Objects
        var cargo = new Cargo(
            dto.Cargo.Description,
            dto.Cargo.Weight,
            dto.Cargo.Containers.Select(c => new Container(new ContainerCode(c.ContainerCode), c.Position)).ToList()
        );

        // 2. Use the Domain's factory method
        var newNotification = Domain.VesselVisitNotificationAggregate.VesselVisitNotification.Create(
            new ETA(dto.EstimatedArrival),
            new ETD(dto.EstimatedDeparture),
            new ImoNumber(dto.VesselImo),
            new RepresentativeId(Guid.Parse(representativeId)),
            cargo
        );

        // 3. Persist the new entity
        await _vvnRepo.AddAsync(newNotification);
        await _context.SaveChangesAsync();

        // 4. Map to the response DTO
        return MapToDto(newNotification);
    }

    public async Task<VesselVisitNotificationDto> UpdateAsync(string notificationId, CreateVvnDto dto)
    {
        var notification = await _vvnRepo.GetByIdAsync(new NotificationId(Guid.Parse(notificationId)))
            ?? throw new KeyNotFoundException($"Notification with ID '{notificationId}' not found.");
            
        var newCargo = new Cargo(
            dto.Cargo.Description,
            dto.Cargo.Weight,
            dto.Cargo.Containers.Select(c => new Container(new ContainerCode(c.ContainerCode), c.Position)).ToList()
        );

        // Use the domain method to perform the update
        notification.UpdateDetails(new ETA(dto.EstimatedArrival), new ETD(dto.EstimatedDeparture), newCargo);

        await _context.SaveChangesAsync();
        return MapToDto(notification);
    }

    public async Task SubmitAsync(string notificationId)
    {
        var notification = await _vvnRepo.GetByIdAsync(new NotificationId(Guid.Parse(notificationId)))
            ?? throw new KeyNotFoundException($"Notification with ID '{notificationId}' not found.");

        // Use the domain method to change the status
        notification.Submit();

        await _context.SaveChangesAsync();
    }
    
    public async Task<VesselVisitNotificationDto?> GetByIdAsync(string notificationId)
    {
        var notification = await _vvnRepo.GetByIdAsync(new NotificationId(Guid.Parse(notificationId)));
        
        return notification == null ? null : MapToDto(notification);
    }

    // This private helper keeps our mapping logic in one place
    private VesselVisitNotificationDto MapToDto(Domain.VesselVisitNotificationAggregate.VesselVisitNotification entity)
    {
        return new VesselVisitNotificationDto
        {
            Id = entity.Id.Value,
            Status = entity.Status.ToString(),
            EstimatedArrival = entity.EstimatedArrival.Value,
            EstimatedDeparture = entity.EstimatedDeparture.Value,
            VesselImo = entity.VesselId.Value,
            SubmittedBy = entity.SubmittedBy.Value,
            AssignedDockId = entity.AssignedDockId?.Value,
            Cargo = new CargoDto
            {
                Description = entity.Cargo.Description,
                Weight = entity.Cargo.Weight,
                Containers = entity.Cargo.Containers.Select(c => new ContainerDto
                {
                    ContainerCode = c.Code.Value,
                    Position = c.Position
                }).ToList()
            },
            CrewMembers = entity.CrewMembers.Select(c => new CrewMemberDto
            {
                Id = c.Id.Value,
                Name = c.Name,
                Nationality = c.Nationality,
                IsSafetyOfficer = c.IsSafetyOfficer
            }).ToList(),
            DecisionLog = entity.DecisionLog.Select(dl => new DecisionLogEntryDto
            {
                Timestamp = dl.Timestamp,
                OfficerId = dl.OfficerId.Value,
                Outcome = dl.Outcome.ToString(),
                Reason = dl.Reason
            }).ToList()
        };
    }
}