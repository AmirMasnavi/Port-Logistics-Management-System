using src.Domain.Shared;
using System;

namespace src.Domain.VesselTypeAggregate
{
    public class VesselTypeDescription : IValueObject
    {
        public string Value { get; private set; }

        public VesselTypeDescription(string value)
        {
            // Descrição pode ser opcional, mas se fornecida, não pode ser apenas espaço em branco
            Value = value ?? string.Empty;
        }

        protected VesselTypeDescription() { }

        public override bool Equals(object obj)
        {
            if (obj == null || GetType() != obj.GetType())
            {
                return false;
            }

            var other = (VesselTypeDescription)obj;
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

