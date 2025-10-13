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
        var location = new StorageAreaLocation(dto.Location);
        var storageArea = new StorageArea(dto.Type, location, dto.Capacity);
        
        await _repository.AddAsync(storageArea);
        await _context.SaveChangesAsync();
        
        return new StorageAreaDto
        {
            Id = storageArea.Id.Value,
            Type = storageArea.Type,
            Location = storageArea.Location.ToString(),
            Capacity = storageArea.Capacity
        };
    }
}