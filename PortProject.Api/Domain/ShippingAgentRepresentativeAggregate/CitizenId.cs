using System;
using System.Text.RegularExpressions;

namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    /// <summary>
    /// Represents a personal identification number of a citizen (e.g., national ID or passport).
    /// </summary>
    public sealed class CitizenId : IEquatable<CitizenId>
    {
        public string Value { get; private set; }

        private CitizenId() { } // EF Core

        public CitizenId(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Citizen ID is mandatory.", nameof(value));

            value = value.Trim().ToUpperInvariant();

            // Patterns:
            // - Portuguese Citizen Card (8 digits + 1 letter, e.g., 12345678Z)
            // - Passport (2 letters + 6–9 digits, e.g., AB1234567)
            // - Generic alphanumeric (8–15 chars)
            var ccPattern = @"^[0-9]{8}[A-Z]$";
            var passportPattern = @"^[A-Z]{2}[0-9]{6,9}$";
            var genericPattern = @"^[A-Z0-9]{8,15}$";

            if (!Regex.IsMatch(value, ccPattern) &&
                !Regex.IsMatch(value, passportPattern) &&
                !Regex.IsMatch(value, genericPattern))
            {
                throw new ArgumentException(
                    "Invalid Citizen ID format. Examples: 12345678Z, AB1234567, or 8–15 alphanumeric characters.",
                    nameof(value));
            }

            Value = value;
        }

        public bool Equals(CitizenId? other)
        {
            if (ReferenceEquals(null, other)) return false;
            if (ReferenceEquals(this, other)) return true;
            return string.Equals(Value, other.Value, StringComparison.OrdinalIgnoreCase);
        }

        public override bool Equals(object? obj) => Equals(obj as CitizenId);

        public override int GetHashCode() =>
            StringComparer.OrdinalIgnoreCase.GetHashCode(Value);

        public static bool operator ==(CitizenId? left, CitizenId? right) =>
            Equals(left, right);

        public static bool operator !=(CitizenId? left, CitizenId? right) =>
            !Equals(left, right);

        public override string ToString() => Value;
    }
}
