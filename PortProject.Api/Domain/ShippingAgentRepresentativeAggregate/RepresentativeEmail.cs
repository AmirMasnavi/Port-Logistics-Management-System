using System.Text.RegularExpressions;

namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    public sealed class RepresentativeEmail
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

        public override bool Equals(object obj) => obj is RepresentativeEmail other && Value.Equals(other.Value);
        public override int GetHashCode() => Value.GetHashCode();
        public override string ToString() => Value;
    }
}
