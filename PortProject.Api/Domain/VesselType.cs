namespace PortProject.Api.Domain
{
    public class VesselType
    {
        public int Id { get; set; }   // Primary key
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Capacity { get; set; }  // TEU capacity
        public int MaxRows { get; set; }
        public int MaxBays { get; set; }
        public int MaxTiers { get; set; }
    }
}
