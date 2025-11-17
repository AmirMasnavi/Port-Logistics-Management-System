using System.Linq;
using Microsoft.EntityFrameworkCore;
using PortProject.Api.Application.Resources.DTOs;
using PortProject.Api.Domain.ResourceAggregate;
using PortProject.Api.Models;
using PortProject.Api.Domain.QualificationAggregate;
using PortProject.Api.Domain;

namespace PortProject.Api.Application.Resources.Services;

public class ResourceService : IResourceService
{
    private readonly PortProjectContext _context;
    private readonly IResourceRepository _resourceRepository;

    public ResourceService(PortProjectContext context, IResourceRepository resourceRepository)
    {
        _context = context;
        _resourceRepository = resourceRepository;
    }

    public async Task<ResourceDto> CreateResourceAsync(CreateResourceDto dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));

        // Kind
        if (string.IsNullOrWhiteSpace(dto.Kind))
            throw new ArgumentException("Kind is required.", nameof(dto.Kind));

        if (!Enum.TryParse<ResourceKind>(dto.Kind, ignoreCase: true, out var kind))
            throw new ArgumentException($"Invalid resource kind: {dto.Kind}", nameof(dto.Kind));

        // Status
        if (string.IsNullOrWhiteSpace(dto.Status)) dto.Status = ResourceStatus.Active.ToString();
        if (!Enum.TryParse<ResourceStatus>(dto.Status, ignoreCase: true, out var status))
            throw new ArgumentException($"Invalid resource status: {dto.Status}", nameof(dto.Status));

        // Auto-generate ResourceCode (removed requirement from DTO)
        var code = await ResourceCodeGenerator.GenerateAsync(_context);

        // Description
        var description = new ResourceDescription(dto.Description ?? string.Empty);

        // Assigned area
        var assignedArea = string.IsNullOrWhiteSpace(dto.AssignedArea) ? null : dto.AssignedArea;

        // Operational capacity mapping depending on kind
        ResourceOperationalCapacity operationalCapacity;
        switch (kind)
        {
            case ResourceKind.Crane:
                if (!dto.AverageContainersPerHour.HasValue)
                    throw new ArgumentException("AverageContainersPerHour is required for Crane resources.",
                        nameof(dto.AverageContainersPerHour));
                operationalCapacity = ResourceOperationalCapacity.ForCrane(dto.AverageContainersPerHour.Value);
                break;
            case ResourceKind.Truck:
                if (!dto.ContainersPerTrip.HasValue)
                    throw new ArgumentException("ContainersPerTrip is required for Truck resources.",
                        nameof(dto.ContainersPerTrip));
                if (!dto.AverageSpeedKmh.HasValue)
                    throw new ArgumentException("AverageSpeedKmh is required for Truck resources.",
                        nameof(dto.AverageSpeedKmh));

                operationalCapacity =
                    ResourceOperationalCapacity.ForTruck(dto.ContainersPerTrip.Value, dto.AverageSpeedKmh.Value);
                break;
            case ResourceKind.Other:
                if (string.IsNullOrWhiteSpace(dto.OtherUnit) || !dto.OtherGenericValue.HasValue)
                    throw new ArgumentException(
                        "OtherUnit and OtherGenericValue are required for Other resource kinds.",
                        nameof(dto.OtherUnit));

                operationalCapacity = ResourceOperationalCapacity.ForOther(dto.OtherUnit!, dto.OtherGenericValue.Value);
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(kind), "Unsupported resource kind.");
        }

        // Setup time
        var setupTime = new ResourceSetupTime(dto.SetupTimeMinutes);

        // Operational window
        var operationalWindow = new ResourceOperationalWindow(dto.OperationalWindowStart, dto.OperationalWindowEnd);

        // Qualifications
        var qualCodes = dto.QualificationRequirements ?? new List<string>();

        // Normalize and validate qualification codes and fetch Qualification entities
        var qualificationEntities = new List<Qualification>();
        if (qualCodes.Count > 0)
        {
            var normalized = qualCodes
                .Where(q => !string.IsNullOrWhiteSpace(q))
                .Select(q => q.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            // Fetch matching Qualification entities
            var codesVos = normalized.Select(s => new QualificationCode(s)).ToList();
            qualificationEntities = await _context.Qualifications
                .Where(q => codesVos.Contains(q.Code))
                .ToListAsync();

            // Check for missing codes
            var foundCodes = qualificationEntities.Select(q => q.Code.Value)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            var missing = normalized.Where(n => !foundCodes.Contains(n)).ToList();
            if (missing.Count > 0)
                throw new ArgumentException(
                    $"The following qualification codes are invalid or do not exist: {string.Join(", ", missing)}",
                    nameof(dto.QualificationRequirements));
        }

        // Create domain Resource
        var resource = new Resource(
            code,
            description,
            kind,
            assignedArea,
            operationalCapacity,
            status,
            setupTime,
            operationalWindow,
            qualificationEntities
        );

        // Persist
        _context.Resources.Add(resource);
        await _context.SaveChangesAsync();

        // Map domain back to ResourceDto
        var result = new ResourceDto
        {
            Code = code.Value,
            Description = dto.Description ?? string.Empty,
            Kind = kind.ToString(),
            AssignedArea = assignedArea,
            Status = status.ToString(),
            SetupTimeMinutes = setupTime.Minutes,
            OperationalWindowStart = dto.OperationalWindowStart.ToString("HH:mm"),
            OperationalWindowEnd = dto.OperationalWindowEnd.ToString("HH:mm"),
            QualificationRequirements = qualificationEntities.Select(q => q.Code.Value).ToList()
        };

        // Fill capacity fields according to kind
        switch (kind)
        {
            case ResourceKind.Crane:
                result.AverageContainersPerHour = operationalCapacity.AverageContainersPerHour;
                break;
            case ResourceKind.Truck:
                result.ContainersPerTrip = operationalCapacity.ContainersPerTrip;
                result.AverageSpeedKmh = operationalCapacity.AverageSpeedKmh;
                break;
            case ResourceKind.Other:
                result.OtherUnit = operationalCapacity.Unit;
                result.OtherGenericValue = operationalCapacity.GenericValue;
                break;
        }

        return result;
    }

    public async Task<ResourceDto?> GetByCodeAsync(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;

        ResourceCode codeVo;
        try
        {
            codeVo = new ResourceCode(code);
        }
        catch
        {
            return null;
        }

        // Load the resource without Include to avoid join duplication/hangs
        var resource = await _context.Resources
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Code == codeVo);

        if (resource == null)
        {
            return null;
        }

        // Load qualifications for the resource via a simple SQL query against the join table
        var sql =
            "SELECT q.* FROM Qualifications q JOIN ResourceQualification rq ON rq.QualificationsCode = q.Code WHERE rq.ResourceCode = {0}";
        var qualificationEntities = await _context.Qualifications.FromSqlRaw(sql, resource.Code.Value).ToListAsync();

        // Build DTO manually (avoid using MapToDto which expects navigation property loaded)
        var dto = new ResourceDto
        {
            Code = resource.Code?.ToString() ?? string.Empty,
            Description = resource.Description?.ToString() ?? string.Empty,
            Kind = resource.Kind.ToString(),
            AssignedArea = resource.AssignedArea,
            Status = resource.Status.ToString(),
            SetupTimeMinutes = resource.SetupTime.Minutes,
            OperationalWindowStart = resource.OperationalWindow != null
                ? resource.OperationalWindow.StartTime.ToString("HH:mm")
                : string.Empty,
            OperationalWindowEnd = resource.OperationalWindow != null
                ? resource.OperationalWindow.EndTime.ToString("HH:mm")
                : string.Empty,
            QualificationRequirements = qualificationEntities.Select(q => q.Code.Value).ToList()
        };

        switch (resource.Kind)
        {
            case ResourceKind.Crane:
                dto.AverageContainersPerHour = resource.OperationalCapacity?.AverageContainersPerHour;
                break;
            case ResourceKind.Truck:
                dto.ContainersPerTrip = resource.OperationalCapacity?.ContainersPerTrip;
                dto.AverageSpeedKmh = resource.OperationalCapacity?.AverageSpeedKmh;
                break;
            case ResourceKind.Other:
                dto.OtherUnit = resource.OperationalCapacity?.Unit;
                dto.OtherGenericValue = resource.OperationalCapacity?.GenericValue;
                break;
        }

        return dto;
    }

    public async Task<IEnumerable<ResourceDto>> GetAllAsync(string? code, string? description, ResourceKind? kind,
        ResourceStatus? status)
    {
        var resource = await _resourceRepository.GetAllAsync(code, description, kind, status);

        return resource.Select(sm => new ResourceDto() {
            Code = sm.Code?.ToString() ?? string.Empty,
            Description = sm.Description?.ToString() ?? string.Empty,
            Kind = sm.Kind.ToString(),
            AssignedArea = sm.AssignedArea,
            Status = sm.Status.ToString(),
            SetupTimeMinutes = sm.SetupTime?.Minutes ?? 0,
            OperationalWindowStart = sm.OperationalWindow != null
                ? sm.OperationalWindow.StartTime.ToString("HH:mm")
                : string.Empty,
            OperationalWindowEnd = sm.OperationalWindow != null
                ? sm.OperationalWindow.EndTime.ToString("HH:mm")
                : string.Empty,
            QualificationRequirements = sm.QualificationRequirements?.ToList() ?? new List<string>()
        });
    }

    public async Task<ResourceDto?> EditResourceAsync(string code, EditResourceDto dto)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        if (dto == null) throw new ArgumentNullException(nameof(dto));

        ResourceCode codeVo;
        try
        {
            codeVo = new ResourceCode(code);
        }
        catch
        {
            return null;
        }

        var resource = await _context.Resources
            .Include(r => r.Qualifications)
            .AsSplitQuery()
            .FirstOrDefaultAsync(r => r.Code == codeVo);

        if (resource == null) return null;

        // Update description if provided
        if (!string.IsNullOrWhiteSpace(dto.Description))
        {
            resource.UpdateDescription(new ResourceDescription(dto.Description));
        }

        // Update assigned area if provided
        if (dto.AssignedArea != null)
        {
            resource.AssignArea(dto.AssignedArea);
        }

        // Update status if provided
        if (!string.IsNullOrWhiteSpace(dto.Status))
        {
            if (Enum.TryParse<ResourceStatus>(dto.Status, ignoreCase: true, out var newStatus))
            {
                resource.UpdateStatus(newStatus);
            }
        }

        // Update qualifications if provided
        if (dto.QualificationRequirements != null)
        {
            var qualCodes = dto.QualificationRequirements
                .Where(q => !string.IsNullOrWhiteSpace(q))
                .Select(q => q.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (qualCodes.Count > 0)
            {
                var codesVos = qualCodes.Select(s => new QualificationCode(s)).ToList();

                // Fetch qualifications from database (WITHOUT AsNoTracking so they're tracked)
                var qualificationEntities = await _context.Qualifications
                    .Where(q => codesVos.Contains(q.Code))
                    .ToListAsync();

                var foundCodes = qualificationEntities
                    .Select(q => q.Code.Value)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                var missing = qualCodes.Where(n => !foundCodes.Contains(n)).ToList();
                if (missing.Count > 0)
                    throw new ArgumentException(
                        $"The following qualification codes are invalid or do not exist: {string.Join(", ", missing)}",
                        nameof(dto.QualificationRequirements));

                // Get current qualification codes
                var currentQualCodes = resource.Qualifications
                    .Select(q => q.Code.Value)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);

                // Remove qualifications that are no longer in the request
                var toRemove = resource.Qualifications
                    .Where(q => !foundCodes.Contains(q.Code.Value))
                    .ToList();
                foreach (var qual in toRemove)
                {
                    resource.RemoveQualification(qual);
                }

                // Add only NEW qualifications (ones that aren't already in the resource)
                foreach (var qualEntity in qualificationEntities)
                {
                    // Skip if this qualification is already associated with the resource
                    if (!currentQualCodes.Contains(qualEntity.Code.Value))
                    {
                        resource.AddQualification(qualEntity);
                    }
                    // If it already exists, do nothing - it's already there!
                }
            }
            else
            {
                // Clear all qualifications
                var allQuals = resource.Qualifications.ToList();
                foreach (var qual in allQuals)
                {
                    resource.RemoveQualification(qual);
                }
            }
        }

        // Update operational capacity based on resource kind
        switch (resource.Kind)
        {
            case ResourceKind.Crane:
                if (dto.AverageContainersPerHour.HasValue)
                {
                    resource.UpdateOperationalCapacity(ResourceOperationalCapacity.ForCrane(dto.AverageContainersPerHour.Value));
                }
                break;
            case ResourceKind.Truck:
                if (dto.ContainersPerTrip.HasValue && dto.AverageSpeedKmh.HasValue)
                {
                    resource.UpdateOperationalCapacity(ResourceOperationalCapacity.ForTruck(dto.ContainersPerTrip.Value, dto.AverageSpeedKmh.Value));
                }
                break;
            case ResourceKind.Other:
                if (!string.IsNullOrWhiteSpace(dto.OtherUnit) && dto.OtherGenericValue.HasValue)
                {
                    resource.UpdateOperationalCapacity(ResourceOperationalCapacity.ForOther(dto.OtherUnit, dto.OtherGenericValue.Value));
                }
                break;
        }

        await _context.SaveChangesAsync();

        // Detach the entity to avoid tracking issues and return DTO without reloading
        _context.Entry(resource).State = EntityState.Detached;

        return MapToDto(resource);
    }


    public async Task<ResourceDto?> UpdateStatusAsync(string code, UpdateResourceStatusDto dto)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        if (dto == null) throw new ArgumentNullException(nameof(dto));

        ResourceCode codeVo;
        try
        {
            codeVo = new ResourceCode(code);
        }
        catch
        {
            return null;
        }

        var resource = await _context.Resources
            .FirstOrDefaultAsync(r => r.Code == codeVo);

        if (resource == null) return null;

        // Use the domain method to update the status
        resource.UpdateStatus(dto.NewStatus);

        // Save the changes to the database
        await _context.SaveChangesAsync();

        // Map and return the updated DTO
        return MapToDto(resource);
    }

    private ResourceDto MapToDto(Resource r)
    {
        var dto = new ResourceDto
        {
            Code = r.Code?.ToString() ?? string.Empty,
            Description = r.Description?.ToString() ?? string.Empty,
            Kind = r.Kind.ToString(),
            AssignedArea = r.AssignedArea,
            Status = r.Status.ToString(),
            SetupTimeMinutes = r.SetupTime?.Minutes ?? 0,
            OperationalWindowStart = r.OperationalWindow != null
                ? r.OperationalWindow.StartTime.ToString("HH:mm")
                : string.Empty,
            OperationalWindowEnd = r.OperationalWindow != null
                ? r.OperationalWindow.EndTime.ToString("HH:mm")
                : string.Empty,
            // Use the domain-exposed QualificationRequirements which is safe even if the navigation isn't loaded
            QualificationRequirements = r.QualificationRequirements?.ToList() ?? new List<string>()
        };

        // Guard against null OperationalCapacity for legacy/partial data
        if (r.OperationalCapacity != null)
        {
            switch (r.Kind)
            {
                case ResourceKind.Crane:
                    dto.AverageContainersPerHour = r.OperationalCapacity.AverageContainersPerHour;
                    break;
                case ResourceKind.Truck:
                    dto.ContainersPerTrip = r.OperationalCapacity.ContainersPerTrip;
                    dto.AverageSpeedKmh = r.OperationalCapacity.AverageSpeedKmh;
                    break;
                case ResourceKind.Other:
                    dto.OtherUnit = r.OperationalCapacity.Unit;
                    dto.OtherGenericValue = r.OperationalCapacity.GenericValue;
                    break;
            }
        }

        return dto;
    }
}