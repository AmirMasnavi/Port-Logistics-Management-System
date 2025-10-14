using src.Domain.Shared;

namespace PortProject.Api.Domain.DockAggregate
{
    public class DockLocation : IValueObject
    {
        public string Zone { get; private set; }
        public string Section { get; private set; }

        public DockLocation(string zone, string section)
        {
            if (string.IsNullOrWhiteSpace(zone))
                throw new ArgumentException("Zone cannot be null or empty.", nameof(zone));
            if (string.IsNullOrWhiteSpace(section))
                throw new ArgumentException("Section cannot be null or empty.", nameof(section));

            Zone = zone.Trim();
            Section = section.Trim();
        }

        protected DockLocation() { }

        public override bool Equals(object obj)
        {
            if (obj == null || GetType() != obj.GetType())
                return false;

            var other = (DockLocation)obj;
            return Zone == other.Zone && Section == other.Section;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Zone, Section);
        }

        public override string ToString()
        {
            return $"Zone: {Zone}, Section: {Section}";
        }
    }
}