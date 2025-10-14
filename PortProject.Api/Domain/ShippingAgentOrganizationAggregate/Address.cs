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
            if (string.IsNullOrWhiteSpace(city))
                throw new ArgumentException("The city is a must.", nameof(city));
            if (string.IsNullOrWhiteSpace(country))
                throw new ArgumentException("Country is required.", nameof(country));

            Street  = street.Trim();
            City    = city.Trim();
            Country = country.Trim();
        }

        public static Address Parse(string fullAddress)
        {
            if (string.IsNullOrWhiteSpace(fullAddress))
                throw new ArgumentException("Full address is required.", nameof(fullAddress));

            var parts = fullAddress.Split(',', StringSplitOptions.RemoveEmptyEntries);
            return parts.Length switch
            {
                >= 3 => new Address(parts[0].Trim(), parts[1].Trim(), parts[2].Trim()),
                2    => new Address(parts[0].Trim(), parts[1].Trim(), "unknown"),
                _    => new Address(fullAddress.Trim(), "unknown", "unknown")
            };
        }

        public static Address Empty => new Address("N/A", "N/A", "N/A");

        public bool Equals(Address? other)
        {
            if (ReferenceEquals(null, other)) return false;
            if (ReferenceEquals(this, other)) return true;

            return Street.Equals(other.Street, StringComparison.OrdinalIgnoreCase)
                && City.Equals(other.City, StringComparison.OrdinalIgnoreCase)
                && Country.Equals(other.Country, StringComparison.OrdinalIgnoreCase);
        }

        public override bool Equals(object? obj) => Equals(obj as Address);

        public override int GetHashCode() =>
            HashCode.Combine(
                StringComparer.OrdinalIgnoreCase.GetHashCode(Street),
                StringComparer.OrdinalIgnoreCase.GetHashCode(City),
                StringComparer.OrdinalIgnoreCase.GetHashCode(Country));

        public static bool operator ==(Address? left, Address? right) =>
            Equals(left, right);

        public static bool operator !=(Address? left, Address? right) =>
            !Equals(left, right);

        public override string ToString() => $"{Street}, {City}, {Country}";
    }
}
