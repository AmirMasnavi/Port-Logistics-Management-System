using PortProject.Api.Application.PrivacyPolicy.DTOs;

namespace PortProject.Api.Application.PrivacyPolicy.Services
{
    public interface IPrivacyPolicyService
    {
        // Admin operations
        Task<PrivacyPolicyDto> CreateAndPublishPolicyAsync(CreatePrivacyPolicyDto dto, string createdBy);
        Task<PrivacyPolicyDto> UpdateAndPublishPolicyAsync(Guid id, UpdatePrivacyPolicyDto dto);
        Task<PrivacyPolicyDto?> GetCurrentPolicyAsync();
        Task<PrivacyPolicyDto?> GetPolicyByIdAsync(Guid id);
        Task<List<PrivacyPolicyDto>> GetPolicyHistoryAsync();
        
        // User operations
        Task<UserPolicyStatusDto> GetUserPolicyStatusAsync(string userId);
        Task AcknowledgePolicyAsync(string userId, AcknowledgePrivacyPolicyDto dto, string? ipAddress = null, string? userAgent = null);
    }
}

