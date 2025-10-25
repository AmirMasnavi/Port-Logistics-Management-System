using System.Globalization;
using PortProject.Api.Application.StorageAreas.DTOs;
using PortProject.Api.Domain.StorageAggregate;
using PortProject.Api.Models;

namespace PortProject.Api.Application.StorageAreas.Services;

public class StorageAreaService : IStorageAreaService
{
    private readonly IStorageAreaRepository _repository;
    private readonly PortProjectContext _context;
    
    public StorageAreaService(IStorageAreaRepository repository, PortProjectContext context)
    {
        _repository = repository;
        _context = context;
    }
    
    public async Task<StorageAreaDto> CreateStorageAreaAsync(CreateStorageAreaDto dto)
    {
        if (dto == null) throw new ArgumentNullException(nameof(dto));
        
        // DTO -> Domain
        var location = BuildLocation(dto.Location);
        var type = Enum.Parse<StorageAreaType>(dto.Type, ignoreCase: true);
        var capacity = new StorageCapacity(dto.Capacity);
        var currentOccupancy = new StorageAreaCurrentOccupancy(dto.CurrentOccupancy);

        var storageArea = new StorageArea(location, type, capacity, currentOccupancy);
        
        await _repository.AddAsync(storageArea);
        await _context.SaveChangesAsync();
        
        return new StorageAreaDto
        {
            Id = storageArea.Id?.ToString() ?? "0",
            Type = storageArea.Type.ToString(),
            Location = storageArea.Location?.ToString() ?? string.Empty,
            Capacity = storageArea.Capacity?.Value ?? 0,
            CurrentOccupancy = storageArea.CurrentOccupancy?.Value ?? 0
        };
    }
    
    
    public async Task<StorageAreaDto?> GetByIdAsync(int id)
    {
        var value = new StorageAreaId(id);
        
        var storageArea = await _repository.GetByIdAsync(value);
        
        if (storageArea == null)
            return null;

        return new StorageAreaDto
        {
            Id = storageArea.Id?.ToString() ?? "0",
            Type = storageArea.Type.ToString(),
            Location = storageArea.Location?.ToString() ?? string.Empty,
            Capacity = storageArea.Capacity?.Value ?? 0,
            CurrentOccupancy = storageArea.CurrentOccupancy?.Value ?? 0
        };
    }

    
    
    
    private static StorageAreaLocation BuildLocation(string location)
    {
        if (string.IsNullOrWhiteSpace(location))
            throw new ArgumentException("Location is required.", nameof(location));
        
        var cleaned = location.Replace("(", "").Replace(")", "").Trim();

        var parts = cleaned.Contains(',')
            ? cleaned.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            : cleaned.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (parts.Length < 2)
            throw new ArgumentException("Location must contain two numeric coordinates, e.g. \"12.5, 7.3\".");

        if (!float.TryParse(parts[0], NumberStyles.Float, CultureInfo.InvariantCulture, out var x) ||
            !float.TryParse(parts[1], NumberStyles.Float, CultureInfo.InvariantCulture, out var y))
            throw new ArgumentException("Coordinates must be valid numbers using '.' as decimal separator.");

        return new StorageAreaLocation(x, y);
    }
    
    
    public async Task<StorageAreaDto?> UpdateStorageAreaAsync(int id, UpdateStorageAreaDto dto)
    {
        var value = new StorageAreaId(id);
        
        var storageArea = await _repository.GetByIdAsync(value);
        
        if (storageArea == null)
            return null;

        // Update fields if provided
        if (dto.Location != null)
        {
            var location = BuildLocation(dto.Location);
            storageArea.ChangeLocation(location);
        }

        if (dto.Type != null)
        {
            var type = Enum.Parse<StorageAreaType>(dto.Type, ignoreCase: true);
            storageArea.ChangeType(type);
        }

        if (dto.Capacity.HasValue)
        {
            var capacity = new StorageCapacity(dto.Capacity.Value);
            storageArea.ChangeCapacity(capacity);
        }

        if (dto.CurrentOccupancy.HasValue)
        {
            var occupancy = new StorageAreaCurrentOccupancy(dto.CurrentOccupancy.Value);
            storageArea.ChangeCurrentOccupancy(occupancy);
        }

        await _context.SaveChangesAsync();

        return new StorageAreaDto
        {
            Id = storageArea.Id?.ToString() ?? "0",
            Type = storageArea.Type.ToString(),
            Location = storageArea.Location?.ToString() ?? string.Empty,
            Capacity = storageArea.Capacity?.Value ?? 0,
            CurrentOccupancy = storageArea.CurrentOccupancy?.Value ?? 0
        };
    }
}