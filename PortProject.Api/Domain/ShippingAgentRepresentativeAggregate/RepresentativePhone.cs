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

            // Portuguese mobile numbers: must start with 9 and have exactly 9 digits
            if (!Regex.IsMatch(value, @"^9\d{8}$"))
                throw new ArgumentException("Invalid phone number. It must have 9 digits and start with 9.", nameof(value));

            Value = value;
        }

        public override bool Equals(object obj) => obj is RepresentativePhone other && Value.Equals(other.Value);
        public override int GetHashCode() => Value.GetHashCode();
        public override string ToString() => Value;
    }
}