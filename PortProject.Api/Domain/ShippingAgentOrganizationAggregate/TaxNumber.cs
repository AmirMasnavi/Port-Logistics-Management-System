using System;
using System.Text.RegularExpressions;

namespace PortProject.Api.Domain.ShippingAgentOrganizationAggregate
{
    public sealed class TaxNumber : IEquatable<TaxNumber>
    {
        public string Value { get; }

        private TaxNumber() { } // para EF Core

        public TaxNumber(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Tax number is mandatory.", nameof(value));

            value = value.Trim().ToUpperInvariant();

            // Validação simples: letras seguidas de números, ou apenas dígitos (9-15 chars)
            if (!Regex.IsMatch(value, @"^[A-Z0-9]{8,15}$"))
                throw new ArgumentException("Invalid format for the tax identification number (NIF/VAT).", nameof(value));

            Value = value;
        }

        #region Equality Members
        public bool Equals(TaxNumber other)
        {
            if (ReferenceEquals(null, other)) return false;
            if (ReferenceEquals(this, other)) return true;
            return Value.Equals(other.Value, StringComparison.OrdinalIgnoreCase);
        }

        public override bool Equals(object obj) => Equals(obj as TaxNumber);
        public override int GetHashCode() => Value.GetHashCode(StringComparison.OrdinalIgnoreCase);

        public static bool operator ==(TaxNumber left, TaxNumber right) => Equals(left, right);
        public static bool operator !=(TaxNumber left, TaxNumber right) => !Equals(left, right);
        #endregion

        public override string ToString() => Value;
    }
}