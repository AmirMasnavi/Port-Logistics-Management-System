using System.Text.RegularExpressions;
using System;

namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    public sealed class RepresentativeEmail : IEquatable<RepresentativeEmail>
    {
        public string Value { get; private set; }
        
        private RepresentativeEmail() { }

        public RepresentativeEmail(string value)
        {
            var normalized = value?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(normalized))
                throw new ArgumentException("Email cannot be empty.", nameof(value));
            if (!Regex.IsMatch(normalized, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                throw new ArgumentException("Invalid email format.", nameof(value));
            Value = normalized;
        }

        public override bool Equals(object obj) => Equals(obj as RepresentativeEmail);
        public bool Equals(RepresentativeEmail? other) => other != null && string.Equals(Value, other.Value, StringComparison.OrdinalIgnoreCase);
        public override int GetHashCode() => StringComparer.OrdinalIgnoreCase.GetHashCode(Value ?? string.Empty);
        public override string ToString() => Value;

        // Implicit conversions to help EF and simplify usage
        public static implicit operator string(RepresentativeEmail email) => email?.Value ?? string.Empty;
        public static implicit operator RepresentativeEmail(string s) => new RepresentativeEmail(s);

        public static bool operator ==(RepresentativeEmail? left, RepresentativeEmail? right) => Equals(left, right);
        public static bool operator !=(RepresentativeEmail? left, RepresentativeEmail? right) => !Equals(left, right);
    }
}
