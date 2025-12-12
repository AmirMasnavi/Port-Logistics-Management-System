namespace PortProject.Api.Application.PrivacyPolicy.DTOs
{
    public class PrivacyPolicyDto
    {
        public Guid Id { get; set; }
        public int Version { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public bool IsCurrent { get; set; }
        public DateTime EffectiveDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string? ChangeReason { get; set; }
    }

    public class CreatePrivacyPolicyDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ChangeReason { get; set; }
    }

    public class UpdatePrivacyPolicyDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ChangeReason { get; set; }
    }

    public class AcknowledgePrivacyPolicyDto
    {
        public Guid PolicyId { get; set; }
        public int PolicyVersion { get; set; }
    }

    public class UserPolicyStatusDto
    {
        public bool RequiresAcknowledgment { get; set; }
        public PrivacyPolicyDto? CurrentPolicy { get; set; }
        public int? LastAcknowledgedVersion { get; set; }
    }
}

