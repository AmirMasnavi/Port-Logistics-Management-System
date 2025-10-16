using System.Text.RegularExpressions;

namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    public sealed class RepresentativeEmail
    {
        public string Value { get; private set; }
        
        private RepresentativeEmail() { }

        public RepresentativeEmail(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Email cannot be empty.", nameof(value));
            if (!Regex.IsMatch(value, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                throw new ArgumentException("Invalid email format.", nameof(value));
            Value = value;
        }

        public override bool Equals(object obj) => obj is RepresentativeEmail other && Value.Equals(other.Value);
        public override int GetHashCode() => Value.GetHashCode();
        public override string ToString() => Value;
    }
}
