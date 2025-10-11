
using PortProject.Api.Domain.VesselAggregate;

namespace src.Application.Services
{
    public interface IVesselService
    {
        Task<VesselDto> CreateVesselAsync(VesselCreateDto dto);
        Task<VesselDto> UpdateVesselAsync(VesselDto dto);
        Task<VesselDto?> GetVesselByImoAsync(string imo);
        Task<IEnumerable<VesselDto>> SearchVesselsAsync(string? imo = null, string? name = null, string? operatorName = null);
        Task DeleteVesselAsync(string imo);
    }
}
