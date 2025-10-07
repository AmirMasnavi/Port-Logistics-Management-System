
using src.Domain.Shared;
using System;

namespace src.Domain.VesselTypeAggregate
{
    public class VesselTypeName : IValueObject
    {
        public string Value { get; private set; }

        public VesselTypeName(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new ArgumentException("VesselType name cannot be null or empty.", nameof(value));
            }
            // Adicionar verificações, se necessário
            Value = value;
        }

        protected VesselTypeName() { }

        public override bool Equals(object obj)
        {
            if (obj == null || GetType() != obj.GetType())
            {
                return false;
            }

            var other = (VesselTypeName)obj;
            return Value == other.Value;
        }

        public override int GetHashCode()
        {
            return Value.GetHashCode();
        }

        public override string ToString()
        {
            return Value;
        }
    }
}