using System.Linq;
using Microsoft.EntityFrameworkCore;
using PortProject.Api.Application.Resources.DTOs;
using PortProject.Api.Domain.ResourceAggregate;
using PortProject.Api.Models;

namespace PortProject.Api.Application.Resources.Services;

public class ResourceService : IResourceService
{
    private readonly PortProjectContext _context;

    public ResourceService(PortProjectContext context)
    {
        _context = context;
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

        // ResourceCode
        if (string.IsNullOrWhiteSpace(dto.Code))
            throw new ArgumentException("Code is required.", nameof(dto.Code));

        var code = new ResourceCode(dto.Code);

        // Ensure uniqueness
        var exists = await _context.Resources.AsNoTracking().AnyAsync(r => r.Code == code);
        if (exists)
            throw new ArgumentException($"A resource with code {code} already exists.", nameof(dto.Code));

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
                    throw new ArgumentException("AverageContainersPerHour is required for Crane resources.", nameof(dto.AverageContainersPerHour));
                operationalCapacity = ResourceOperationalCapacity.ForCrane(dto.AverageContainersPerHour.Value);
                break;
            case ResourceKind.Truck:
                if (!dto.ContainersPerTrip.HasValue)
                    throw new ArgumentException("ContainersPerTrip is required for Truck resources.", nameof(dto.ContainersPerTrip));
                if (!dto.AverageSpeedKmh.HasValue)
                    throw new ArgumentException("AverageSpeedKmh is required for Truck resources.", nameof(dto.AverageSpeedKmh));

                operationalCapacity = ResourceOperationalCapacity.ForTruck(dto.ContainersPerTrip.Value, dto.AverageSpeedKmh.Value);
                break;
            case ResourceKind.Other:
                if (string.IsNullOrWhiteSpace(dto.OtherUnit) || !dto.OtherGenericValue.HasValue)
                    throw new ArgumentException("OtherUnit and OtherGenericValue are required for Other resource kinds.", nameof(dto.OtherUnit));

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
        var qualifications = dto.QualificationRequirements ?? new List<string>();

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
            qualifications
        );

        // Persist
        _context.Resources.Add(resource);
        await _context.SaveChangesAsync();

        // Map domain back to ResourceDto
        var result = new ResourceDto
        {
            Code = dto.Code,
            Description = dto.Description ?? string.Empty,
            Kind = kind.ToString(),
            AssignedArea = assignedArea,
            Status = status.ToString(),
            SetupTimeMinutes = setupTime.Minutes,
            OperationalWindowStart = dto.OperationalWindowStart.ToString("HH:mm"),
            OperationalWindowEnd = dto.OperationalWindowEnd.ToString("HH:mm"),
            QualificationRequirements = qualifications.ToList()
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
        
        var resource = await _context.Resources.AsNoTracking().FirstOrDefaultAsync(r => r.Code == codeVo);
        
        return resource == null ? null : MapToDto(resource);
    }

    public async Task<IEnumerable<ResourceDto>> GetAllAsync(string? nameFilter, ResourceKind? typeFilter)
    {
        var query = _context.Resources.AsNoTracking().AsQueryable();

        // Apply server-side filters that are safe to translate
        if (typeFilter.HasValue)
            query = query.Where(r => r.Kind == typeFilter.Value);

        if (!string.IsNullOrWhiteSpace(nameFilter))
        {
            try
            {
                var codeVo = new ResourceCode(nameFilter);
                query = query.Where(r => r.Code == codeVo);
                var list = await query.ToListAsync();
                return list.Select(MapToDto).ToList();
            }
            catch
            {
                // means nameFilter is not valid -> goes to in-memory description
            }
            
        }

        // For non-numeric nameFilter we can't reliably translate the VO->string call to SQL across all providers
        // so bring the (possibly type-filtered) results into memory and then apply description contains filter.
        var resources = await query.ToListAsync();

        if (!string.IsNullOrWhiteSpace(nameFilter))
        {
            resources = resources
                .Where(r => (r.Description?.ToString() ?? string.Empty).Contains(nameFilter, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        return resources.Select(MapToDto).ToList();
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
    
        var resource = await _context.Resources.FirstOrDefaultAsync(r => r.Code == codeVo);
        if (resource == null) return null;
    
        // Update description
        if (!string.IsNullOrWhiteSpace(dto.Description))
        {
            var newDescription = new ResourceDescription(dto.Description);
            resource.UpdateDescription(newDescription);
        }
    
        // Update operational capacity based on resource kind
        // Only update if the relevant fields for that kind are provided and valid
        if (resource.Kind == ResourceKind.Crane && dto.AverageContainersPerHour.HasValue && dto.AverageContainersPerHour.Value > 0)
        {
            var newCapacity = ResourceOperationalCapacity.ForCrane(dto.AverageContainersPerHour.Value);
            resource.UpdateOperationalCapacity(newCapacity);
        }
        else if (resource.Kind == ResourceKind.Truck && 
                 dto.ContainersPerTrip.HasValue && dto.ContainersPerTrip.Value > 0 &&
                 dto.AverageSpeedKmh.HasValue && dto.AverageSpeedKmh.Value > 0)
        {
            var newCapacity = ResourceOperationalCapacity.ForTruck(dto.ContainersPerTrip.Value, dto.AverageSpeedKmh.Value);
            resource.UpdateOperationalCapacity(newCapacity);
        }
        else if (resource.Kind == ResourceKind.Other && 
                 !string.IsNullOrWhiteSpace(dto.OtherUnit) && 
                 dto.OtherUnit != "string" && // Ignore default placeholder value
                 dto.OtherGenericValue.HasValue && 
                 dto.OtherGenericValue.Value > 0)
        {
            var newCapacity = ResourceOperationalCapacity.ForOther(dto.OtherUnit, dto.OtherGenericValue.Value);
            resource.UpdateOperationalCapacity(newCapacity);
        }
    
        // Update assigned area (allow setting to null or empty)
        if (dto.AssignedArea != null && dto.AssignedArea != "string") // Ignore default placeholder value
        {
            resource.AssignArea(string.IsNullOrWhiteSpace(dto.AssignedArea) ? null : dto.AssignedArea);
        }
    
        // Update qualifications (filter out placeholder values)
        if (dto.QualificationRequirements != null)
        {
            var validQualifications = dto.QualificationRequirements
                .Where(q => !string.IsNullOrWhiteSpace(q) && q != "string")
                .ToList();
            resource.SetQualifications(validQualifications);
        }
    
        // Update status
        if (!string.IsNullOrWhiteSpace(dto.Status))
        {
            if (Enum.TryParse<ResourceStatus>(dto.Status, ignoreCase: true, out var status))
            {
                switch (status)
                {
                    case ResourceStatus.Active:
                        resource.Activate();
                        break;
                    case ResourceStatus.Inactive:
                        resource.Deactivate();
                        break;
                    case ResourceStatus.UnderMaintenance:
                        resource.SetUnderMaintenance();
                        break;
                }
            }
        }
    
        await _context.SaveChangesAsync();
    
        // Reload the resource from database to ensure all properties are loaded
        var updatedResource = await _context.Resources.AsNoTracking().FirstOrDefaultAsync(r => r.Code == codeVo);
        return updatedResource == null ? null : MapToDto(updatedResource);
    }


    private ResourceDto MapToDto(Resource r)
    {
        var dto = new ResourceDto
        {
            Code = r.Code.ToString(),
            Description = r.Description.ToString(),
            Kind = r.Kind.ToString(),
            AssignedArea = r.AssignedArea,
            Status = r.Status.ToString(),
            SetupTimeMinutes = r.SetupTime.Minutes,
            OperationalWindowStart = r.OperationalWindow.StartTime.ToString("HH:mm"),
            OperationalWindowEnd = r.OperationalWindow.EndTime.ToString("HH:mm"),
            QualificationRequirements = r.QualificationRequirements.ToList()
        };

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

        return dto;
    }
}