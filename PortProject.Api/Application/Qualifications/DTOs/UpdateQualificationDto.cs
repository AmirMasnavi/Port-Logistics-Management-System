namespace PortProject.Api.Application.Qualifications.DTOs;

/// <summary>
/// DTO for updating an existing qualification's details.
/// </summary>
public class UpdateQualificationDto
{
    // Code is used for identification (in the URL), not updated here.
    public string Name { get; set; }
    public string Description { get; set; }
}