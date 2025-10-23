namespace PortProject.Api.Application.StaffMembers.DTOs;

public class StaffMemberDto
{
    public string MecanographicNumber { get; set; }
    public string ShortName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public string CurrentStatus { get; set; }
    public string OperationalWindow { get; set; }
    public List<string> QualificationCodes { get; set; } = new();
}