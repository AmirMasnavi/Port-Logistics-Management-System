using System;
using System.Text.RegularExpressions;

namespace PortProject.Api.Domain.ShippingAgentOrganizationAggregate
{
    public sealed class TaxNumber : IEquatable<TaxNumber>
    {
        public string Value { get; }

        private TaxNumber() { } // EF Core

        public TaxNumber(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Tax number is mandatory.", nameof(value));

            value = value.Trim().ToUpperInvariant();

            // Letras e/ou dígitos, 8–15 chars (ajusta se precisares)
            if (!Regex.IsMatch(value, @"^[A-Z0-9]{8,15}$"))
                throw new ArgumentException("Invalid format for the tax identification number (NIF/VAT).", nameof(value));

            Value = value;
        }

        public bool Equals(TaxNumber? other)
        {
            if (ReferenceEquals(null, other)) return false;
            if (ReferenceEquals(this, other)) return true;
            return string.Equals(Value, other.Value, StringComparison.OrdinalIgnoreCase);
        }

        public override bool Equals(object? obj) => Equals(obj as TaxNumber);

        public override int GetHashCode() =>
            StringComparer.OrdinalIgnoreCase.GetHashCode(Value);

        public static bool operator ==(TaxNumber? left, TaxNumber? right) =>
            Equals(left, right);

        public static bool operator !=(TaxNumber? left, TaxNumber? right) =>
            !Equals(left, right);

        public override string ToString() => Value;
    }
}