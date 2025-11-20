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
    private readonly IShippingAgentRepresentativeRepository _repRepo;
    private readonly IDockRepository _dockRepo;

    public VesselVisitNotificationService(
        IVesselVisitNotificationRepository vvnRepo, 
        PortProjectContext context, 
        IShippingAgentRepresentativeRepository repRepo,
        IDockRepository dockRepo)
    {
        _vvnRepo = vvnRepo;
        _context = context;
        _repRepo = repRepo;
        _dockRepo = dockRepo;
    }


    public async Task<VesselVisitNotificationDto> CreateAsync(CreateVvnDto dto, string representativeId)
    {
        
        // 1. Find the representative by their BUSINESS ID
        var rep = await _repRepo.GetByCitizenIdAsync(new CitizenId(dto.RepresentativeCitizenId));
        if (rep == null)
        {
            throw new KeyNotFoundException($"Representative with Citizen ID '{dto.RepresentativeCitizenId}' not found.");
        }
        // 2. Get their INTERNAL ID (Guid)
        var repInternalId = rep.RepresentativeId;
        
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
            repInternalId,
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
        return await MapToDtoAsync(newNotification);
    }

    public async Task<VesselVisitNotificationDto> UpdateAsync(string businessId, CreateVvnDto dto)
    {
        var notification = await _vvnRepo.GetByBusinessIdAsync(businessId)
                           ?? throw new KeyNotFoundException($"Notification with Business ID '{businessId}' not found.");

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
        return await MapToDtoAsync(notification);
    }

    public async Task SubmitAsync(string businessId)
    {
        var notification = await _vvnRepo.GetByBusinessIdAsync(businessId)
                           ?? throw new KeyNotFoundException($"Notification with Business ID '{businessId}' not found.");

        // Use the domain method to change the status
        notification.Submit();

        await _context.SaveChangesAsync();
    }

    public async Task<VesselVisitNotificationDto?> GetByBusinessIdAsync(string id)
    {
        var entity = await _vvnRepo.GetByBusinessIdAsync(id);
        return entity is null ? null : await MapToDtoAsync(entity);
    }

    public async Task<VesselVisitNotificationDto> ApproveAsync(string businessId, ApproveVvnDto dto)
    {
        var notification = await _vvnRepo.GetByBusinessIdAsync(businessId)
                           ?? throw new KeyNotFoundException($"Notification {businessId} not found.");

        if (notification.Status != NotificationStatus.Submitted)
            throw new InvalidOperationException("Only submitted notifications can be approved.");
        
        // Resolve dock name to dock ID
        var dock = await _dockRepo.GetByNameAsync(new DockName(dto.DockName));
        if (dock == null)
            throw new ArgumentException($"Dock with name '{dto.DockName}' does not exist.");
        
        notification.Approve(new MecanographicNumber(dto.OfficerId), dock.Id);
        await _context.SaveChangesAsync();

        return await MapToDtoAsync(notification);
    }

    public async Task<VesselVisitNotificationDto> RejectAsync(string businessId, RejectVvnDto dto)
    {
        var notification = await _vvnRepo.GetByBusinessIdAsync(businessId)
                           ?? throw new KeyNotFoundException($"Notification {businessId} not found.");

        if (notification.Status != NotificationStatus.Submitted)
            throw new InvalidOperationException("Only submitted notifications can be rejected.");

        notification.Reject(new MecanographicNumber(dto.OfficerId), dto.Reason);
        await _context.SaveChangesAsync();

        return await MapToDtoAsync(notification);
    }


    public async Task ReopenAsync(string businessId)
    {
        var notification = await _vvnRepo.GetByBusinessIdAsync(businessId)
                           ?? throw new KeyNotFoundException($"Notification {businessId} not found.");
    
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
            if (Enum.TryParse<NotificationStatus>(status, ignoreCase: true, out var statusEnum))
            {
                query = query.Where(v => v.Status == statusEnum);
            }
            else
            {
                return new List<VesselVisitNotificationDto>();
            }
        }

        if (!string.IsNullOrWhiteSpace(representativeId))
        {
            var repId = new RepresentativeId(Guid.Parse(representativeId));
            query = query.Where(v => v.SubmittedBy == repId);
        }

        if (from.HasValue)
            query = query.Where(v => v.EstimatedArrival.Value >= from.Value);

        if (to.HasValue)
        {
            var toDateEnd = to.Value.Date.AddDays(1);
            query = query.Where(v => v.EstimatedArrival.Value < toDateEnd);
        }
        
        var results = await query.ToListAsync();
        return await MapListToDtoAsync(results);
    }

    public async Task<List<DecisionLogEntryDto>> GetDecisionLogAsync(string notificationId)
    {
        var notification = await _vvnRepo.GetByBusinessIdAsync(notificationId)
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
        return await MapListToDtoAsync(result);
    }


    // This private helper keeps our mapping logic in one place
    private async Task<VesselVisitNotificationDto> MapToDtoAsync(Domain.VesselVisitNotificationAggregate.VesselVisitNotification entity)
    {
        // Single-entity version used by Create/Update/Get flows: load its representative name directly.
        var rep = await _repRepo.GetByIdAsync(entity.SubmittedBy);
        var submittedByName = rep?.RepresentativeName.Value ?? "Unknown Representative";

        // Load dock name if assigned
        string? dockName = null;
        if (entity.AssignedDockId != null)
        {
            var dock = await _dockRepo.GetByIdAsync(entity.AssignedDockId);
            dockName = dock?.Name.Value;
        }

        return MapCore(entity, submittedByName, dockName);
    }

    private async Task<List<VesselVisitNotificationDto>> MapListToDtoAsync(IEnumerable<Domain.VesselVisitNotificationAggregate.VesselVisitNotification> entities)
    {
        var entityList = entities.ToList();
        if (!entityList.Any())
            return new List<VesselVisitNotificationDto>();

        // Collect all distinct representative IDs referenced by the notifications
        var repIds = entityList
            .Select(e => e.SubmittedBy)
            .Distinct()
            .ToList();

        // Load all needed representatives in one go
        var reps = await _repRepo.GetAllAsync();
        var repLookup = reps
            .Where(r => r.RepresentativeId != null && repIds.Contains(r.RepresentativeId))
            .ToDictionary(r => r.RepresentativeId!, r => r.RepresentativeName.Value);

        // Collect all distinct dock IDs referenced by the notifications
        var dockIds = entityList
            .Where(e => e.AssignedDockId != null)
            .Select(e => e.AssignedDockId!)
            .Distinct()
            .ToList();

        // Load all needed docks in one go
        var docks = await _dockRepo.GetByIdsAsync(dockIds);
        var dockLookup = docks.ToDictionary(d => d.Id, d => d.Name.Value);

        // Map each notification using the resolved name (or fallback if not found)
        var dtos = entityList
            .Select(e =>
            {
                var name = repLookup.TryGetValue(e.SubmittedBy, out var repName)
                    ? repName
                    : "Unknown Representative";
                
                string? dockName = null;
                if (e.AssignedDockId != null && dockLookup.TryGetValue(e.AssignedDockId, out var dn))
                {
                    dockName = dn;
                }
                
                return MapCore(e, name, dockName);
            })
            .ToList();

        return dtos;
    }

    private static VesselVisitNotificationDto MapCore(Domain.VesselVisitNotificationAggregate.VesselVisitNotification entity, string submittedByName, string? dockName)
    {
        return new VesselVisitNotificationDto
        {
            BusinessId = entity.BusinessId,
            Status = entity.Status.ToString(),
            EstimatedArrival = entity.EstimatedArrival.Value,
            EstimatedDeparture = entity.EstimatedDeparture.Value,
            VesselImo = entity.VesselId.Value,
            SubmittedBy = submittedByName,
            AssignedDockId = entity.AssignedDockId?.Value,
            AssignedDockName = dockName,
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
                Name = c.Name,
                Nationality = c.Nationality,
                IsSafetyOfficer = c.IsSafetyOfficer
            }).ToList(),
            DecisionLog = entity.DecisionLog
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
