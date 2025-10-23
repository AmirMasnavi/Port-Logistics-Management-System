using System;
using System.Text.RegularExpressions;

namespace PortProject.Api.Domain.ShippingAgentOrganizationAggregate
{
    /// <summary>
    /// Represents a validated tax identification number (NIF/VAT/TIN).
    /// </summary>
    public sealed class TaxNumber : IEquatable<TaxNumber>
    {
        public string Value { get; }

        private TaxNumber() { } // EF Core

        public TaxNumber(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Tax number is mandatory.", nameof(value));

            value = value.Trim().ToUpperInvariant();

            // Padrões aceites:
            // - Portugal (NIF): 9 dígitos numéricos, o 1º entre 1 e 9
            // - UE VAT: prefixo de 2 letras + 8-12 dígitos (ex: PT123456789)
            // - Outros genéricos: 8–15 caracteres alfanuméricos
            var nifPattern = @"^[1-9][0-9]{8}$";
            var vatPattern = @"^[A-Z]{2}[0-9A-Z]{8,12}$";
            var genericPattern = @"^[A-Z0-9]{8,15}$";

            if (!Regex.IsMatch(value, nifPattern) &&
                !Regex.IsMatch(value, vatPattern) &&
                !Regex.IsMatch(value, genericPattern))
            {
                throw new ArgumentException(
                    "Invalid format for the tax identification number. " +
                    "Examples: 123456789 (NIF), PT123456789 (VAT), or alphanumeric 8–15 chars.",
                    nameof(value));
            }

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
