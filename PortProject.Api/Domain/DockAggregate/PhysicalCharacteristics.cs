using src.Domain.Shared;

namespace PortProject.Api.Domain.DockAggregate
{
    public class PhysicalCharacteristics : IValueObject
    {
        public double LengthInMeters { get; private set; }
        public double DepthInMeters { get; private set; }
        public double MaxDraftInMeters { get; private set; }

        public PhysicalCharacteristics(double length, double depth, double maxDraft)
        {
            if (length <= 0)
                throw new ArgumentException("Length must be greater than zero.", nameof(length));
            if (depth <= 0)
                throw new ArgumentException("Depth must be greater than zero.", nameof(depth));
            if (maxDraft <= 0)
                throw new ArgumentException("Max draft must be greater than zero.", nameof(maxDraft));

            LengthInMeters = length;
            DepthInMeters = depth;
            MaxDraftInMeters = maxDraft;
        }

        protected PhysicalCharacteristics() { }

        public override bool Equals(object obj)
        {
            if (obj == null || GetType() != obj.GetType())
                return false;

            var other = (PhysicalCharacteristics)obj;
            return LengthInMeters == other.LengthInMeters &&
                   DepthInMeters == other.DepthInMeters &&
                   MaxDraftInMeters == other.MaxDraftInMeters; 
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(LengthInMeters, DepthInMeters, MaxDraftInMeters);
        }

        public override string ToString()
        {
            return $"Length: {LengthInMeters}m, Depth: {DepthInMeters}m, Max Draft: {MaxDraftInMeters}m";
        }
    }
}