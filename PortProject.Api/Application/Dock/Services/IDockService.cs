using PortProject.Api.Application.Dock.DTOs;

namespace PortProject.Api.Application.Dock.Services
{
    public interface IDockService
    {
        Task<DockDto> CreateDockAsync(DockCreateDto dto);
        Task<DockDto> UpdateDockAsync(DockDto dto);
        Task<DockDto> GetDockByIdAsync(string id);
        Task<IEnumerable<DockDto>> GetAllDocksAsync();
        /// <summary>
        /// Pesquisa docas com filtros opcionais e suporte a paginação e ordenação.
        /// </summary>
        Task<IEnumerable<DockDto>> SearchDocksAsync(
            string? name = null, string? vesselTypeId = null, string? zone = null,
            string? section = null, int page = 1, int pageSize = 10, string? sortBy = "name", string? sortOrder = "asc");

        Task DeleteDockAsync(string id);
    }
}
