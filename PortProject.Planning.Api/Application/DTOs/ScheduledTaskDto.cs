namespace PortProject.Planning.Api.Application.DTOs;

using System.Text.Json.Serialization;

public class ScheduledTaskDto
{
    // IDs (for internal use)
    public string VesselVisitId { get; set; }
    
    [JsonIgnore]  // Don't serialize DockId in JSON response
    public string DockId { get; set; }
    
    public string ResourceId { get; set; }
    public string StaffId { get; set; }
    
    public string VesselImo { get; set; }
    
    public string VesselVisitBusinessId { get; set; }
    public string DockName { get; set; }
    public string ResourceKind { get; set; }
    public string StaffShortName { get; set; }
    
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}