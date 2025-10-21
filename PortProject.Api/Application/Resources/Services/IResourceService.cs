using PortProject.Api.Application.Resources.DTOs;
using PortProject.Api.Domain.ResourceAggregate;

namespace PortProject.Api.Application.Resources.Services;

public interface IResourceService
{
    Task<ResourceDto> CreateResourceAsync(CreateResourceDto dto);
    
    Task<ResourceDto?> GetByCodeAsync(string code);
    
    Task<IEnumerable<ResourceDto>> GetAllAsync(string? nameFilter, ResourceKind? typeFilter);
}