using System;

namespace PortProject.Api.Domain.VesselAggregate
{
    /// <summary>
    /// Value Object representing a vessel operator or owner.
    /// </summary>
    public record VesselOperator
    {
        public string Value { get; }

        public VesselOperator(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Operator name cannot be null or empty.", nameof(value));

            Value = value.Trim();
        }

        public override string ToString() => Value;

        public static implicit operator string(VesselOperator vesselOperator) => vesselOperator.Value;
    }
}