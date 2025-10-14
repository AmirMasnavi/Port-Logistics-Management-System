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

            // Optional regex to restrict invalid characters (only letters, digits, spaces, and common punctuation)
            if (!Regex.IsMatch(value, @"^[A-Za-z0-9\s.,&'()-]+$"))
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