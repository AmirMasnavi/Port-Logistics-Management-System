using System.Text.RegularExpressions;

namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    public sealed class RepresentativePhone
    {
        public string Value { get; private set; }
        
        private RepresentativePhone() { }

        public RepresentativePhone(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Phone number cannot be empty.", nameof(value));
            // Simple validation: only digits, spaces, +, -
            if (!Regex.IsMatch(value, @"^[\d\s\+\-]+$"))
                throw new ArgumentException("Invalid phone number format.", nameof(value));
            Value = value;
        }

        public override bool Equals(object obj) => obj is RepresentativePhone other && Value.Equals(other.Value);
        public override int GetHashCode() => Value.GetHashCode();
        public override string ToString() => Value;
    }
}
