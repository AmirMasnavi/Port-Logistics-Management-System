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
            // Allow any non-empty trimmed string (e.g., GUIDs or numeric strings)
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
