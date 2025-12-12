namespace PortProject.Api.Domain.PrivacyPolicyAggregate
{
    public interface IPrivacyPolicyRepository
    {
        Task<PrivacyPolicy?> GetCurrentPolicyAsync();
        Task<PrivacyPolicy?> GetByIdAsync(Guid id);
        Task<List<PrivacyPolicy>> GetPolicyHistoryAsync();
        Task<PrivacyPolicy> AddAsync(PrivacyPolicy policy);
        Task UpdateAsync(PrivacyPolicy policy);
        Task<int> GetNextVersionNumberAsync();
        
        // User acknowledgment methods
        Task<UserPolicyAcknowledgment> AddAcknowledgmentAsync(UserPolicyAcknowledgment acknowledgment);
        Task<UserPolicyAcknowledgment?> GetUserLatestAcknowledgmentAsync(string userId);
        Task<bool> HasUserAcknowledgedCurrentPolicyAsync(string userId);
    }
}

