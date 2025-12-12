using PortProject.Api.Application.PrivacyPolicy.DTOs;
using PortProject.Api.Domain.PrivacyPolicyAggregate;

namespace PortProject.Api.Application.PrivacyPolicy.Services
{
    public class PrivacyPolicyService : IPrivacyPolicyService
    {
        private readonly IPrivacyPolicyRepository _repository;

        public PrivacyPolicyService(IPrivacyPolicyRepository repository)
        {
            _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        }

        public async Task<PrivacyPolicyDto> CreateAndPublishPolicyAsync(CreatePrivacyPolicyDto dto, string createdBy)
        {
            // Archive the current policy if exists
            var currentPolicy = await _repository.GetCurrentPolicyAsync();
            if (currentPolicy != null)
            {
                currentPolicy.MarkAsArchived();
                await _repository.UpdateAsync(currentPolicy);
            }

            // Create new policy
            var newPolicy = new Domain.PrivacyPolicyAggregate.PrivacyPolicy(
                dto.Title,
                dto.Content,
                createdBy,
                dto.ChangeReason
            );

            // Set version number
            var nextVersion = await _repository.GetNextVersionNumberAsync();
            newPolicy.SetVersion(nextVersion);
            newPolicy.MarkAsCurrent();

            // Save
            await _repository.AddAsync(newPolicy);

            return MapToDto(newPolicy);
        }

        public async Task<PrivacyPolicyDto> UpdateAndPublishPolicyAsync(Guid id, UpdatePrivacyPolicyDto dto)
        {
            var policy = await _repository.GetByIdAsync(id);
            if (policy == null)
                throw new KeyNotFoundException($"Privacy Policy with ID {id} not found.");

            policy.UpdateContent(dto.Title, dto.Content, dto.ChangeReason);
            await _repository.UpdateAsync(policy);

            return MapToDto(policy);
        }

        public async Task<PrivacyPolicyDto?> GetCurrentPolicyAsync()
        {
            var policy = await _repository.GetCurrentPolicyAsync();
            return policy == null ? null : MapToDto(policy);
        }

        public async Task<PrivacyPolicyDto?> GetPolicyByIdAsync(Guid id)
        {
            var policy = await _repository.GetByIdAsync(id);
            return policy == null ? null : MapToDto(policy);
        }

        public async Task<List<PrivacyPolicyDto>> GetPolicyHistoryAsync()
        {
            var policies = await _repository.GetPolicyHistoryAsync();
            return policies.Select(MapToDto).ToList();
        }

        public async Task<UserPolicyStatusDto> GetUserPolicyStatusAsync(string userId)
        {
            var currentPolicy = await _repository.GetCurrentPolicyAsync();
            var latestAcknowledgment = await _repository.GetUserLatestAcknowledgmentAsync(userId);

            var requiresAcknowledgment = false;
            if (currentPolicy != null)
            {
                if (latestAcknowledgment == null)
                {
                    requiresAcknowledgment = true;
                }
                else if (latestAcknowledgment.PolicyVersion < currentPolicy.Version)
                {
                    requiresAcknowledgment = true;
                }
            }

            return new UserPolicyStatusDto
            {
                RequiresAcknowledgment = requiresAcknowledgment,
                CurrentPolicy = currentPolicy == null ? null : MapToDto(currentPolicy),
                LastAcknowledgedVersion = latestAcknowledgment?.PolicyVersion
            };
        }

        public async Task AcknowledgePolicyAsync(string userId, AcknowledgePrivacyPolicyDto dto, 
            string? ipAddress = null, string? userAgent = null)
        {
            var policy = await _repository.GetByIdAsync(dto.PolicyId);
            if (policy == null)
                throw new KeyNotFoundException($"Privacy Policy with ID {dto.PolicyId} not found.");

            if (policy.Version != dto.PolicyVersion)
                throw new InvalidOperationException("Policy version mismatch.");

            var acknowledgment = new UserPolicyAcknowledgment(
                userId,
                dto.PolicyId,
                dto.PolicyVersion,
                ipAddress,
                userAgent
            );

            await _repository.AddAcknowledgmentAsync(acknowledgment);
        }

        private static PrivacyPolicyDto MapToDto(Domain.PrivacyPolicyAggregate.PrivacyPolicy policy)
        {
            return new PrivacyPolicyDto
            {
                Id = policy.Id,
                Version = policy.Version,
                Title = policy.Title,
                Content = policy.Content,
                IsCurrent = policy.IsCurrent,
                EffectiveDate = policy.EffectiveDate,
                CreatedAt = policy.CreatedAt,
                CreatedBy = policy.CreatedBy,
                ChangeReason = policy.ChangeReason
            };
        }
    }
}

