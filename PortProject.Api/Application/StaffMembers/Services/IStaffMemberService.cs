using PortProject.Api.Domain.StaffMemberAggregate;

namespace PortProject.Api.Application.StaffMembers.Services;
using PortProject.Api.Application.StaffMembers.DTOs;


// The interface defines the "contract" for our service.
public interface IStaffMemberService
{
    // It takes a DTO for creation and will return the DTO representation of the created entity.
    Task<StaffMemberDto> CreateStaffMemberAsync(CreateStaffMemberDto dto);
    Task<StaffMemberDto?> GetByIdAsync(string id);
    Task<StaffMemberDto?> UpdateStatusAsync(string id, UpdateStaffStatusDto dto);
    Task<IEnumerable<StaffMemberDto>> GetAllAsync(string? nameFilter, StaffStatus? statusFilter,string? qualificationCode);

    // --- NEW: manage qualifications for a staff member by Qualification Code ---
    Task<StaffMemberDto?> AddQualificationAsync(string mecanographicNumber, string qualificationCode);
    Task<StaffMemberDto?> RemoveQualificationAsync(string mecanographicNumber, string qualificationCode);
}