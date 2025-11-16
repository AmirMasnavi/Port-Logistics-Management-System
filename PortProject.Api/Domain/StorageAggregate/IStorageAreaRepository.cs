namespace PortProject.Api.Domain.StorageAggregate;

public interface IStorageAreaRepository
{
    Task AddAsync(StorageArea storageArea);
    
    Task<StorageArea?> GetByIdAsync(string code);
    
    Task<IEnumerable<StorageArea>> GetAllAsync(StorageAreaType? typeFilter, string? locationFilter);
}