namespace PortProject.Api.Application.UserAdmin.DTOs;
public class AssignRoleDto
{
    public string Email { get; set; }
    public string Role { get; set; } // "Administrator", "LogisticsOperator", etc.
}