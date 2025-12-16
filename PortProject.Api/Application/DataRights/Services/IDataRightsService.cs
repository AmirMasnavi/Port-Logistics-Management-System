using PortProject.Api.Application.DataRights.DTOs;

namespace PortProject.Api.Application.DataRights.Services;

public interface IDataRightsService
{
    Task<DataRightsRequestDto> CreateRequestAsync(string userEmail, CreateDataRightsRequestDto dto);
    Task<UserPersonalDataDto> GetUserPersonalDataAsync(string userEmail);
    Task<List<DataRightsRequestDto>> GetUserRequestsAsync(string userEmail);
    Task<byte[]> GeneratePersonalDataPdfAsync(string userEmail);
}

