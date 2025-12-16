namespace PortProject.Api.Domain.DataRightsAggregate;

public interface IDataRightsRequestRepository
{
    Task<DataRightsRequest> AddAsync(DataRightsRequest request);
    Task<DataRightsRequest?> GetByIdAsync(Guid id);
    Task<List<DataRightsRequest>> GetByUserEmailAsync(string email);
    Task<List<DataRightsRequest>> GetAllAsync();
    Task SaveChangesAsync();
}

