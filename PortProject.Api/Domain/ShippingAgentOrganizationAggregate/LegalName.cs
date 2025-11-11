using System;
using System.Text.RegularExpressions;

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

            if (value.Length < 3 || value.Length > 100)
                throw new ArgumentException("The legal name must contain between 3 and 100 characters.", nameof(value));

            // Allow any Unicode letters and numbers, spaces and common punctuation
            // (keeps previous intent but supports accents like á, ç, ã, etc.).
            // Pattern explanation:
            //  - \p{L}: any kind of letter from any language
            //  - \p{N}: any kind of numeric character in any script
            //  - whitespace and the punctuation used previously
            var pattern = @"^[\p{L}\p{N}\s.,&'()\-]+$";
            if (!Regex.IsMatch(value, pattern))
                throw new ArgumentException("The legal name contains invalid characters.", nameof(value));

            Value = value.Trim();
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