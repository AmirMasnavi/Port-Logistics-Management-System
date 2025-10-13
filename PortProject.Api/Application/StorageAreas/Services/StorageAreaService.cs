using System.Globalization;
using PortProject.Api.Application.StorageAreas.DTOs;
using PortProject.Api.Domain.StorageAggregate;
using PortProject.Api.Models;

namespace PortProject.Api.Application.StorageAreas.Services;

public class StorageAreaService
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
        // DTO -> Domain
        var id = new StorageAreaId(0);
        var location = BuildLocation(dto.Location);
        var type = Enum.Parse<StorageAreaType>(dto.Type, ignoreCase: true);
        var capacity = new StorageCapacity(dto.Capacity);

        var storageArea = new StorageArea(id, location, type, capacity);
        
        await _repository.AddAsync(storageArea);
        await _context.SaveChangesAsync();
        
        return new StorageAreaDto
        {
            Id = storageArea.Id.ToString(),
            Type = storageArea.Type.ToString(),
            Location = storageArea.Location.ToString(),
            Capacity = dto.Capacity
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
}