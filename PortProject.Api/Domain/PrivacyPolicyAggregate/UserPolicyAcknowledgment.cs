using System.ComponentModel.DataAnnotations;

namespace PortProject.Api.Domain.PrivacyPolicyAggregate
{
    /// <summary>
    /// Tracks user acknowledgments of privacy policy versions
    /// Required for GDPR compliance to prove users were informed
    /// </summary>
    public class UserPolicyAcknowledgment
    {
        [Key]
        public Guid Id { get; private set; }
        
        public string UserId { get; private set; }
        
        public string UserEmail { get; private set; }
        
        public Guid PrivacyPolicyId { get; private set; }
        
        public int PolicyVersion { get; private set; }
        
        public DateTime AcknowledgedAt { get; private set; }
        
        public string? IpAddress { get; private set; }
        
        public string? UserAgent { get; private set; }

        // Navigation property
        public PrivacyPolicy PrivacyPolicy { get; private set; } = null!;

        // EF Constructor
        protected UserPolicyAcknowledgment()
        {
            UserId = string.Empty;
            UserEmail = string.Empty;
        }

        public UserPolicyAcknowledgment(string userId, Guid privacyPolicyId, int policyVersion, 
            string? ipAddress = null, string? userAgent = null)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new ArgumentException("UserId cannot be null or empty.", nameof(userId));

            Id = Guid.NewGuid();
            UserId = userId;
            UserEmail = userId; // Store email as well for easier querying
            PrivacyPolicyId = privacyPolicyId;
            PolicyVersion = policyVersion;
            AcknowledgedAt = DateTime.UtcNow;
            IpAddress = ipAddress;
            UserAgent = userAgent;
        }
    }
}
