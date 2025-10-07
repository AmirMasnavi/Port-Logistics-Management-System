
using src.Domain.Shared;
using System;

namespace src.Domain.VesselTypeAggregate
{
    public class VesselTypeDimensions : IValueObject
    {
        public int Rows { get; private set; }
        public int Bays { get; private set; }
        public int Tiers { get; private set; }

        public VesselTypeDimensions(int rows, int bays, int tiers)
        {
            if (rows < 0 || bays < 0 || tiers < 0)
            {
                throw new ArgumentException("Rows, bays, and tiers cannot be negative.");
            }
            Rows = rows;
            Bays = bays;
            Tiers = tiers;
        }

        protected VesselTypeDimensions() { }

        public override bool Equals(object obj)
        {
            if (obj == null || GetType() != obj.GetType())
            {
                return false;
            }

            var other = (VesselTypeDimensions)obj;
            return Rows == other.Rows && Bays == other.Bays && Tiers == other.Tiers;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Rows, Bays, Tiers);
        }

        public override string ToString()
        {
            return $"Rows: {Rows}, Bays: {Bays}, Tiers: {Tiers}";
        }
    }
}