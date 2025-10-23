using System.Security.AccessControl;

namespace PortProject.Api.Domain.ResourceAggregate;

public interface IResourceRepository
{
    Task AddAsync(Resource resource);
    
    Task<Resource?> GetByIdAsync(ResourceCode code);
    
    Task<IEnumerable<Resource>> GetAllAsync(ResourceKind? typeFilter);
}