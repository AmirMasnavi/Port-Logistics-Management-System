namespace PortProject.Planning.Api.Application.DTOs;

public class ScheduledTaskDto
{
    // IDs (for internal use)
    public string VesselVisitId { get; set; }
    public string DockId { get; set; }
    public string ResourceId { get; set; }
    public string StaffId { get; set; }
    
    // Display names (for UI)
    public string VesselVisitBusinessId { get; set; }
    public string DockName { get; set; }
    public string ResourceKind { get; set; }
    public string StaffShortName { get; set; }
    
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}