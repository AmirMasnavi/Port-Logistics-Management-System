using src.Domain.Shared;
using System;

namespace src.Domain.VesselTypeAggregate
{
    public class VesselTypeCapacity : IValueObject
    {
        public int Value { get; private set; }

        public VesselTypeCapacity(int value)
        {
            if (value < 0)
            {
                throw new ArgumentException("VesselType capacity cannot be negative.", nameof(value));
            }
            Value = value;
        }

        protected VesselTypeCapacity() { }

        public override bool Equals(object obj)
        {
            if (obj == null || GetType() != obj.GetType())
            {
                return false;
            }

            var other = (VesselTypeCapacity)obj;
            return Value == other.Value;
        }

        public override int GetHashCode()
        {
            return Value.GetHashCode();
        }

        public override string ToString()
        {
            return Value.ToString();
        }
    }
}

