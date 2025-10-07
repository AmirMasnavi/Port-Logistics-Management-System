namespace PortProject.Api.Application.StaffMembers.DTOs;


public class CreateStaffMemberDto
{
    public string MecanographicNumber { get; set; }
    public string ShortName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public DayOfWeek[]? WorkingDays { get; set; }
}