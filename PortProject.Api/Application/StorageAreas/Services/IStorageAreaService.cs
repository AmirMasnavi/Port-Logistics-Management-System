using PortProject.Api.Application.StorageAreas.DTOs;
using PortProject.Api.Domain.StorageAggregate;

namespace PortProject.Api.Application.StorageAreas.Services;

public interface IStorageAreaService
{
    Task<StorageAreaDto> CreateStorageAreaAsync(CreateStorageAreaDto dto);
    Task<StorageAreaDto?> GetByIdAsync(int id);
    Task<IEnumerable<StorageAreaDto>> GetAllAsync(string? nameFilter, StorageAreaType? typeFilter);
}