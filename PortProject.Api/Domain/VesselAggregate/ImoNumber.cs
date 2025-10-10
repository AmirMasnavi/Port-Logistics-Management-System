using System;
using System.Text.RegularExpressions;

namespace PortProject.Api.Domain.VesselAggregate
{
    /// <summary>
    /// Value Object representing a Vessel's IMO number (7 digits with check digit).
    /// </summary>
    public record ImoNumber
    {
        public string Value { get; }

        public ImoNumber(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("IMO number cannot be null or empty.", nameof(value));

            value = value.Trim();

            if (!IsValidImoNumber(value))
                throw new ArgumentException("Invalid IMO number format. Must be 7 digits with a valid check digit.", nameof(value));

            Value = value;
        }

        private static bool IsValidImoNumber(string imo)
        {
            // Must have exactly 7 digits
            if (!Regex.IsMatch(imo, @"^\d{7}$"))
                return false;

            int checkDigit = imo[6] - '0';
            int sum = 0;

            // Weighted sum of first 6 digits: 7,6,5,4,3,2
            for (int i = 0; i < 6; i++)
            {
                int digit = imo[i] - '0';
                sum += digit * (7 - i);
            }

            int calculated = sum % 10;
            return calculated == checkDigit;
        }

        public override string ToString() => Value;

        public static implicit operator string(ImoNumber imoNumber) => imoNumber.Value;
    }
}