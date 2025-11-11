using System;

namespace PortProject.Api.Domain.ShippingAgentOrganizationAggregate
{
    public class LegalName
    {
        public string Value { get; private set; }

        protected LegalName() { } // Required by ORM (EF Core)

        public LegalName(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("The legal name cannot be empty.", nameof(value));

            var trimmed = value.Trim();
            if (trimmed.Length < 3 || trimmed.Length > 100)
                throw new ArgumentException("The legal name must contain between 3 and 100 characters.", nameof(value));

            // No regex character restrictions: accept any visible characters users may need
            Value = trimmed;
        }

        public override string ToString() => Value;

        public override bool Equals(object obj)
        {
            if (obj is not LegalName other)
                return false;
            return Value.Equals(other.Value, StringComparison.OrdinalIgnoreCase);
        }

        public override int GetHashCode() => Value.ToLowerInvariant().GetHashCode();
    }
}