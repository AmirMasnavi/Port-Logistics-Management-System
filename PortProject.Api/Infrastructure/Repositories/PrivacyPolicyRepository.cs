using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain.PrivacyPolicyAggregate;
using PortProject.Api.Models;

namespace PortProject.Api.Infrastructure.Repositories
{
    public class PrivacyPolicyRepository : IPrivacyPolicyRepository
    {
        private readonly PortProjectContext _context;

        public PrivacyPolicyRepository(PortProjectContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        public async Task<PrivacyPolicy?> GetCurrentPolicyAsync()
        {
            return await _context.PrivacyPolicies
                .Where(p => p.IsCurrent)
                .OrderByDescending(p => p.Version)
                .FirstOrDefaultAsync();
        }

        public async Task<PrivacyPolicy?> GetByIdAsync(Guid id)
        {
            return await _context.PrivacyPolicies.FindAsync(id);
        }

        public async Task<List<PrivacyPolicy>> GetPolicyHistoryAsync()
        {
            return await _context.PrivacyPolicies
                .OrderByDescending(p => p.Version)
                .ToListAsync();
        }

        public async Task<PrivacyPolicy> AddAsync(PrivacyPolicy policy)
        {
            await _context.PrivacyPolicies.AddAsync(policy);
            await _context.SaveChangesAsync();
            return policy;
        }

        public async Task UpdateAsync(PrivacyPolicy policy)
        {
            _context.PrivacyPolicies.Update(policy);
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetNextVersionNumberAsync()
        {
            var maxVersion = await _context.PrivacyPolicies
                .MaxAsync(p => (int?)p.Version);
            
            return (maxVersion ?? 0) + 1;
        }

        // User acknowledgment methods
        public async Task<UserPolicyAcknowledgment> AddAcknowledgmentAsync(UserPolicyAcknowledgment acknowledgment)
        {
            await _context.UserPolicyAcknowledgments.AddAsync(acknowledgment);
            await _context.SaveChangesAsync();
            return acknowledgment;
        }

        public async Task<UserPolicyAcknowledgment?> GetUserLatestAcknowledgmentAsync(string userId)
        {
            return await _context.UserPolicyAcknowledgments
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.AcknowledgedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> HasUserAcknowledgedCurrentPolicyAsync(string userId)
        {
            var currentPolicy = await GetCurrentPolicyAsync();
            if (currentPolicy == null) return true; // No policy to acknowledge

            var latestAcknowledgment = await GetUserLatestAcknowledgmentAsync(userId);
            if (latestAcknowledgment == null) return false;

            return latestAcknowledgment.PolicyVersion >= currentPolicy.Version;
        }
    }
}

