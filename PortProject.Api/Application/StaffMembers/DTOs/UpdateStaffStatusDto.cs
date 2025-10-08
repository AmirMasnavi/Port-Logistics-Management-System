using PortProject.Api.Domain.StaffMemberAggregate;

namespace PortProject.Api.Application.StaffMembers.DTOs;

public class UpdateStaffStatusDto
{
    public StaffStatus NewStatus { get; set; }
}