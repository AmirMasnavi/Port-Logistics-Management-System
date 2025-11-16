using PortProject.Api.Application.StorageAreas.DTOs;
using PortProject.Api.Domain.StorageAggregate;

namespace PortProject.Api.Application.StorageAreas.Services;

public interface IStorageAreaService
{
    Task<StorageAreaDto> CreateStorageAreaAsync(CreateStorageAreaDto dto);
    Task<StorageAreaDto?> GetByIdAsync(string code);
    Task<StorageAreaDto?> UpdateStorageAreaAsync(string code, UpdateStorageAreaDto dto);
    Task<List<StorageAreaDto>> GetAllAsync();
}