using PortProject.Api.Application.Resources.DTOs;
using PortProject.Api.Domain.ResourceAggregate;

namespace PortProject.Api.Application.Resources.Services;

public interface IResourceService
{
    Task<ResourceDto> CreateResourceAsync(CreateResourceDto dto);
    
    Task<ResourceDto?> GetByCodeAsync(string code);
    
    Task<IEnumerable<ResourceDto>> GetAllAsync(string? nameFilter, ResourceKind? typeFilter);

    // New: full filterable search
    Task<IEnumerable<ResourceDto>> GetAllAsync(string? code, string? description, ResourceKind? kind, ResourceStatus? status);
    
    Task<ResourceDto?> EditResourceAsync(string code, EditResourceDto dto);
    
    Task<ResourceDto?> UpdateStatusAsync(string code, UpdateResourceStatusDto dto);
}