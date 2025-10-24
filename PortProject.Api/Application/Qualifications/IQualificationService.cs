using PortProject.Api.Application.Qualifications.DTOs;

namespace PortProject.Api.Application.Qualifications;

public interface IQualificationService
{
    Task<QualificationDto> CreateAsync(CreateQualificationDto dto);
    Task<IEnumerable<QualificationDto>> GetAllAsync();
    Task<QualificationDto?> GetByCodeAsync(string code);
    Task<QualificationDto?> UpdateAsync(string code, UpdateQualificationDto dto);
}