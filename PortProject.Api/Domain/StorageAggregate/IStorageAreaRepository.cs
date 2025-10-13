namespace PortProject.Api.Domain.StorageAggregate;

public interface IStorageAreaRepository
{
    Task AddAsync(StorageArea storageArea);
    
    Task<StorageArea?> GetByIdAsync(StorageAreaId id);
    
    Task<IEnumerable<StorageArea>> GetAllAsync(StorageAreaType? typeFilter, string? locationFilter);
}