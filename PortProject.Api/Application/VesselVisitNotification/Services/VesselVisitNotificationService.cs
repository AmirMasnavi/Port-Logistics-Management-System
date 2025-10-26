using Microsoft.EntityFrameworkCore;
using PortProject.Api.Application.VesselVisitNotification.DTOs;
using PortProject.Api.Domain.DockAggregate;
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Domain.StaffMemberAggregate;
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

        var crewMembers = dto.CrewMembers? // Check if the list is provided
            .Select(cmDto => new CrewMember(cmDto.Name, cmDto.Nationality, cmDto.IsSafetyOfficer))
            .ToList();

        // 2. Use the Domain's factory method
        var newNotification = Domain.VesselVisitNotificationAggregate.VesselVisitNotification.Create(
            new ETA(dto.EstimatedArrival),
            new ETD(dto.EstimatedDeparture),
            new ImoNumber(dto.VesselImo),
            new RepresentativeId(Guid.Parse(representativeId)),
            cargo,
            crewMembers
        );

        if (newNotification.CrewMembers.Any())
        {
            _context.AddRange(newNotification.CrewMembers);
        }

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

        var newCrewMembers = dto.CrewMembers?
            .Select(cmDto => new CrewMember(cmDto.Name, cmDto.Nationality, cmDto.IsSafetyOfficer))
            .ToList();

        // Use the domain method to perform the update
        notification.UpdateDetails(new ETA(dto.EstimatedArrival), new ETD(dto.EstimatedDeparture), newCargo,
            newCrewMembers);

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

    public async Task<VesselVisitNotificationDto?> GetByIdAsync(string id)
    {
        var guid = Guid.Parse(id);
        var entity = await _vvnRepo.GetByIdAsync(new NotificationId(guid));
        return entity is null ? null : MapToDto(entity);
    }

    public async Task<VesselVisitNotificationDto> ApproveAsync(string notificationId, ApproveVvnDto dto)
    {
        var id = new NotificationId(Guid.Parse(notificationId));
        var notification = await _vvnRepo.GetByIdAsync(id)
                           ?? throw new KeyNotFoundException($"Notification {notificationId} not found.");

        if (notification.Status != NotificationStatus.Submitted)
            throw new InvalidOperationException("Only submitted notifications can be approved.");       
        
        notification.Approve(new MecanographicNumber(dto.OfficerId), new DockId(dto.DockId));
        await _context.SaveChangesAsync();

        return MapToDto(notification);
    }

    public async Task<VesselVisitNotificationDto> RejectAsync(string notificationId, RejectVvnDto dto)
    {
        var id = new NotificationId(Guid.Parse(notificationId));
        var notification = await _vvnRepo.GetByIdAsync(id)
                           ?? throw new KeyNotFoundException($"Notification {notificationId} not found.");

        if (notification.Status != NotificationStatus.Submitted)
            throw new InvalidOperationException("Only submitted notifications can be rejected.");

        notification.Reject(new MecanographicNumber(dto.OfficerId), dto.Reason);
        await _context.SaveChangesAsync();

        return MapToDto(notification);
    }


    public async Task ReopenAsync(string notificationId)
    {
        var id = new NotificationId(Guid.Parse(notificationId));
        var notification = await _vvnRepo.GetByIdAsync(id)
                           ?? throw new KeyNotFoundException($"Notification {notificationId} not found.");
    
        if (notification.Status != NotificationStatus.Rejected)
            throw new InvalidOperationException("Cannot resubmit a notification that is not rejected.");
    
        notification.Reopen();
        await _context.SaveChangesAsync();
    }


    public async Task<List<VesselVisitNotificationDto>> SearchAsync(
        string? vesselImo,
        string? status,
        string? representativeId,
        DateTime? from,
        DateTime? to)
    {
        var query = _context.VesselVisitNotifications
            .Include(vvn => vvn.Cargo).ThenInclude(c => c.Containers)
            .Include(vvn => vvn.CrewMembers)
            .Include(vvn => vvn.DecisionLog)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(vesselImo))
            query = query.Where(v => v.VesselId == new ImoNumber(vesselImo));
        
        if (!string.IsNullOrWhiteSpace(status))
        {
            // Convert to the Enum *before* the query
            if (Enum.TryParse<NotificationStatus>(status, ignoreCase: true, out var statusEnum))
            {
                // Compare the enums directly. EF Core will use your converter.
                query = query.Where(v => v.Status == statusEnum); // 
            }
            else
            {
                // If an invalid status string is passed, return no results
                return new List<VesselVisitNotificationDto>();
            }
        }

        if (!string.IsNullOrWhiteSpace(representativeId))
        {
            // Convert to the Value Object *before* the query
            var repId = new RepresentativeId(Guid.Parse(representativeId));
            
            // Compare the Value Objects directly. EF Core will use your converter.
            query = query.Where(v => v.SubmittedBy == repId); // 
        }

        if (from.HasValue)
            query = query.Where(v => v.EstimatedArrival.Value >= from.Value);

        if (to.HasValue)
            query = query.Where(v => v.EstimatedArrival.Value <= to.Value);

        var results = await query.ToListAsync();
        return results.Select(MapToDto).ToList();
    }

    public async Task<List<DecisionLogEntryDto>> GetDecisionLogAsync(string notificationId)
    {
        var id = new NotificationId(Guid.Parse(notificationId));
        var notification = await _vvnRepo.GetByIdAsync(id)
                           ?? throw new KeyNotFoundException($"Notification {notificationId} not found.");

        return notification.DecisionLog.Select(dl => new DecisionLogEntryDto
        {
            Timestamp = dl.Timestamp,
            OfficerId = dl.OfficerId.Value,
            Outcome = dl.Outcome.ToString(),
            Reason = dl.Reason
        }).ToList();
    }

    public async Task<List<VesselVisitNotificationDto>> GetNotificationsForRepresentativeAsync(VvnSearchFilterDto filter)
    {
        if (filter == null || string.IsNullOrWhiteSpace(filter.RepresentativeId))
            throw new FormatException("RepresentativeId is required and must be a valid GUID.");

        if (!Guid.TryParse(filter.RepresentativeId, out var repGuid))
            throw new FormatException("RepresentativeId is not a valid GUID.");

        var query = _context.VesselVisitNotifications
            .Include(v => v.Cargo).ThenInclude(c => c.Containers)
            .Include(v => v.CrewMembers)
            .Include(v => v.DecisionLog)
            .Where(v => v.SubmittedBy.Value == repGuid);

        var result = await query.ToListAsync();
        return result.Select(MapToDto).ToList();
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
            DecisionLog = entity.DecisionLog?
                .OrderByDescending(dl => dl.Timestamp)
                .Select(dl => new DecisionLogEntryDto
                {
                    Timestamp = dl.Timestamp,
                    OfficerId = dl.OfficerId.Value,
                    Outcome = dl.Outcome.ToString(),
                    Reason = dl.Reason
                }).ToList() ?? new List<DecisionLogEntryDto>()
        };
    }
}