using src.Dto;


using System.Collections.Generic;
using System.Threading.Tasks;

namespace src.Application.Services
{
    public interface IVesselTypeService
    {
        Task<VesselTypeDto> CreateVesselTypeAsync(VesselTypeDto dto);
        Task<VesselTypeDto> UpdateVesselTypeAsync(VesselTypeDto dto);
        Task<VesselTypeDto> GetVesselTypeByIdAsync(string id);
        Task<IEnumerable<VesselTypeDto>> GetAllVesselTypesAsync();
        Task<IEnumerable<VesselTypeDto>> SearchVesselTypesAsync(string searchTerm = null);
        Task DeleteVesselTypeAsync(string id);
    }
}
