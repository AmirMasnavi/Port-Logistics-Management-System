using System;

namespace PortProject.Api.Domain.ShippingAgentOrganizationAggregate
{
    public sealed class Address : IEquatable<Address>
    {
        public string Street { get; }
        public string City   { get; }
        public string Country{ get; }

        private Address() { } // EF Core

        public Address(string street, string city, string country)
        {
            if (string.IsNullOrWhiteSpace(street))
                throw new ArgumentException("Address is required.", nameof(street));
            
            Street  = street.Trim();
            City    = (city ?? string.Empty).Trim();
            Country = (country ?? string.Empty).Trim();
        }

        public static Address Parse(string fullAddress)
        {
            if (string.IsNullOrWhiteSpace(fullAddress))
                throw new ArgumentException("Full address is required.", nameof(fullAddress));

            var parts = fullAddress.Split(',', StringSplitOptions.RemoveEmptyEntries);
            return parts.Length switch
            {
                >= 3 => new Address(parts[0].Trim(), parts[1].Trim(), parts[2].Trim()),
                2    => new Address(parts[0].Trim(), parts[1].Trim(), string.Empty),
                _    => new Address(fullAddress.Trim(), string.Empty, string.Empty)
            };
        }

        public static Address Empty => new Address(string.Empty, string.Empty, string.Empty);

        public bool Equals(Address? other)
        {
            if (ReferenceEquals(null, other)) return false;
            if (ReferenceEquals(this, other)) return true;

            return string.Equals(Street, other.Street, StringComparison.OrdinalIgnoreCase)
                && string.Equals(City, other.City, StringComparison.OrdinalIgnoreCase)
                && string.Equals(Country, other.Country, StringComparison.OrdinalIgnoreCase);
        }

        public override bool Equals(object? obj) => Equals(obj as Address);

        public override int GetHashCode() =>
            HashCode.Combine(
                StringComparer.OrdinalIgnoreCase.GetHashCode(Street ?? string.Empty),
                StringComparer.OrdinalIgnoreCase.GetHashCode(City ?? string.Empty),
                StringComparer.OrdinalIgnoreCase.GetHashCode(Country ?? string.Empty));

        public static bool operator ==(Address? left, Address? right) =>
            Equals(left, right);

        public static bool operator !=(Address? left, Address? right) =>
            !Equals(left, right);

        public override string ToString()
        {
            // Join only non-empty parts
            var parts = new[] { Street, City, Country };
            return string.Join(", ", Array.FindAll(parts, p => !string.IsNullOrWhiteSpace(p)));
        }
    }
}
