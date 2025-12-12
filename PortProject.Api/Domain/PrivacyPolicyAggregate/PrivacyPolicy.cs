using System.ComponentModel.DataAnnotations;

namespace PortProject.Api.Domain.PrivacyPolicyAggregate
{
    /// <summary>
    /// Aggregate Root for Privacy Policy management
    /// Supports GDPR compliance by maintaining versioned policies with full history
    /// </summary>
    public class PrivacyPolicy
    {
        [Key]
        public Guid Id { get; private set; }
        
        public int Version { get; private set; }
        
        public string Title { get; private set; }
        
        public string Content { get; private set; }
        
        public bool IsCurrent { get; private set; }
        
        public DateTime EffectiveDate { get; private set; }
        
        public DateTime CreatedAt { get; private set; }
        
        public string CreatedBy { get; private set; }
        
        // For audit trail
        public string? ChangeReason { get; private set; }

        // EF Constructor
        protected PrivacyPolicy()
        {
            Title = string.Empty;
            Content = string.Empty;
            CreatedBy = string.Empty;
        }

        public PrivacyPolicy(string title, string content, string createdBy, string? changeReason = null)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new ArgumentException("Title cannot be null or empty.", nameof(title));
            
            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("Content cannot be null or empty.", nameof(content));
            
            if (string.IsNullOrWhiteSpace(createdBy))
                throw new ArgumentException("CreatedBy cannot be null or empty.", nameof(createdBy));

            Id = Guid.NewGuid();
            Title = title;
            Content = content;
            CreatedBy = createdBy;
            ChangeReason = changeReason;
            IsCurrent = false; // Will be set to true when published
            Version = 1; // Will be incremented when retrieved from previous version
            EffectiveDate = DateTime.UtcNow;
            CreatedAt = DateTime.UtcNow;
        }

        public void SetVersion(int version)
        {
            if (version <= 0)
                throw new ArgumentException("Version must be positive.", nameof(version));
            
            Version = version;
        }

        public void MarkAsCurrent()
        {
            IsCurrent = true;
        }

        public void MarkAsArchived()
        {
            IsCurrent = false;
        }

        public void UpdateContent(string title, string content, string? changeReason = null)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new ArgumentException("Title cannot be null or empty.", nameof(title));
            
            if (string.IsNullOrWhiteSpace(content))
                throw new ArgumentException("Content cannot be null or empty.", nameof(content));

            Title = title;
            Content = content;
            ChangeReason = changeReason;
        }
    }
}

