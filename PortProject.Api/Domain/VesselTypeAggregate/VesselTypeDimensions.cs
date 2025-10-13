
using src.Domain.Shared;
using System;

namespace src.Domain.VesselTypeAggregate
{
    public class VesselTypeDimensions : IValueObject
    {
        public int MaxRows { get; private set; }
        public int MaxBays { get; private set; }
        public int MaxTiers { get; private set; }

        public VesselTypeDimensions(int rows, int bays, int tiers)
        {
            if (rows < 0 || bays < 0 || tiers < 0)
            {
                throw new ArgumentException("Rows, bays, and tiers cannot be negative.");
            }
            MaxRows = rows;
            MaxBays = bays;
            MaxTiers = tiers;
        }

        protected VesselTypeDimensions() { }

        public override bool Equals(object obj)
        {
            if (obj == null || GetType() != obj.GetType())
            {
                return false;
            }

            var other = (VesselTypeDimensions)obj;
            return MaxRows == other.MaxRows && MaxBays == other.MaxBays && MaxTiers == other.MaxTiers;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(MaxRows, MaxBays, MaxTiers);
        }

        public override string ToString()
        {
            return $"Rows: {MaxRows}, Bays: {MaxBays}, Tiers: {MaxTiers}";
        }
    }
}