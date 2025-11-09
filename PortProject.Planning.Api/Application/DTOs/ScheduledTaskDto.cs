namespace PortProject.Planning.Api.Application.DTOs;

public class ScheduledTaskDto
{
    public string VesselVisitId { get; set; }
    public string DockId { get; set; }
    public string ResourceId { get; set; } // The crane
    public string StaffId { get; set; }    // The operator
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}