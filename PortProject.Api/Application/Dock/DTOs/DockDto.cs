namespace PortProject.Api.Application.Dock.DTOs
{
    public class DockDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string LocationZone { get; set; }
        public string LocationSection { get; set; }
        public double LengthInMeters { get; set; }
        public double DepthInMeters { get; set; }
        public double MaxDraftInMeters { get; set; }
        public int NumberOfSTSCranes { get; set; }
        public List<string> AllowedVesselTypeIds { get; set; } = new();
    }
}
