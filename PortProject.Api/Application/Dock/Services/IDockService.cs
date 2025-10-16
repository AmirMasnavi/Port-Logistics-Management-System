using PortProject.Api.Application.Dock.DTOs;

namespace PortProject.Api.Application.Dock.Services
{
    public interface IDockService
    {
        Task<DockDto> CreateDockAsync(DockCreateDto dto);
        Task<DockDto> UpdateDockAsync(DockDto dto);
        Task<DockDto> GetDockByIdAsync(string id);
        Task<IEnumerable<DockDto>> GetAllDocksAsync();
        Task<IEnumerable<DockDto>> SearchDocksAsync(string? name, string? location, string? vesselTypeId);
        Task DeleteDockAsync(string id);
    }
}
