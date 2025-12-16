namespace PortProject.Api.Application.DataRights.DTOs;

public class DataRightsRequestDto
{
    public Guid Id { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string RequestType { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? ProcessedBy { get; set; }
    public string? Response { get; set; }
}

public class CreateDataRightsRequestDto
{
    public string RequestType { get; set; } = string.Empty; // "DataAccess", "DataRectification", "DataDeletion"
    public string? Details { get; set; }
}

public class UserPersonalDataDto
{
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public StaffMemberDataDto? StaffMemberData { get; set; }
    public ShippingAgentRepresentativeDataDto? ShippingAgentRepresentativeData { get; set; }
    public List<PolicyAcknowledgmentDataDto> PolicyAcknowledgments { get; set; } = new();
}

public class StaffMemberDataDto
{
    public string MecanographicNumber { get; set; } = string.Empty;
    public string ShortName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public List<string> Qualifications { get; set; } = new();
    public string CurrentStatus { get; set; } = string.Empty;
}

public class ShippingAgentRepresentativeDataDto
{
    public string RepresentativeId { get; set; } = string.Empty;
    public string CitizenId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Nationality { get; set; } = string.Empty;
    public string? OrganizationId { get; set; }
}

public class PolicyAcknowledgmentDataDto
{
    public int PolicyVersion { get; set; }
    public DateTime AcknowledgedAt { get; set; }
}
