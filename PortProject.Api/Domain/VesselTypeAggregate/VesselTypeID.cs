using System;
using System.Linq;
using src.Domain.Shared;

namespace src.Domain.VesselTypeAggregate
{
    public sealed class VesselTypeId : EntityId
    {
      
        protected VesselTypeId() : base("0") { }

        public VesselTypeId(string value) : base(value) { }

        public static VesselTypeId New(string value) => new VesselTypeId(value);

        protected override object createFromString(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                throw new ArgumentException("O identificador não pode ser nulo ou vazio.", nameof(text));

            var trimmed = text.Trim();
            if (!trimmed.All(char.IsDigit))
                throw new ArgumentException("O identificador do VesselType deve conter apenas dígitos (0-9).", nameof(text));

            return trimmed;
        }

        public override string AsString()
        {
            // ObjValue is set in the base constructor via createFromString and is a string after validation
            return (string)ObjValue;
        }

        public override string ToString() => AsString();
    }
}
