using System.Text.RegularExpressions; // Add this

namespace PortProject.Api.Domain.VesselVisitNotificationAggregate;

public record ContainerCode
{
    public string Value { get; private set; }
    private ContainerCode() { }

    public ContainerCode(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Container code cannot be null or empty.", nameof(value));

        value = value.Trim().ToUpperInvariant();

        // Basic Format Check: 4 letters followed by 7 numbers
        if (!Regex.IsMatch(value, @"^[A-Z]{4}\d{7}$"))
            throw new ArgumentException("Invalid container code format. Must be 4 letters followed by 7 numbers (e.g., MSKU1234567).", nameof(value));

        // ISO 6346 Check Digit Validation
        if (!HasValidCheckDigit(value))
            throw new ArgumentException($"Invalid container code check digit. The check digit for '{value.Substring(0, 10)}' is incorrect.", nameof(value));

        Value = value;
    }

    /// <summary>
    /// Validates the check digit according to ISO 6346.
    /// </summary>
    private static bool HasValidCheckDigit(string code)
    {
        if (code.Length != 11) return false; // Should have been caught by regex, but double-check

        int sum = 0;
        for (int i = 0; i < 10; i++)
        {
            int numericValue;
            char character = code[i];

            if (character >= '0' && character <= '9')
            {
                numericValue = character - '0';
            }
            else // It's a letter (A-Z)
            {
                // Assign numeric value: A=10, B=12, C=13, ..., K=21, L=23,... Z=38
                // Skip values divisible by 11 (11, 22, 33)
                numericValue = character - 'A' + 10;
                if (numericValue >= 11) numericValue++; // Skip 11 (B->12)
                if (numericValue >= 22) numericValue++; // Skip 22 (L->23)
                if (numericValue >= 33) numericValue++; // Skip 33 (W->34)
            }

            // Multiply by 2^i
            sum += numericValue * (int)Math.Pow(2, i);
        }

        int calculatedCheckDigit = sum % 11;
        if (calculatedCheckDigit == 10) calculatedCheckDigit = 0; // Remainder 10 maps to check digit 0

        int providedCheckDigit = code[10] - '0';

        return calculatedCheckDigit == providedCheckDigit;
    }
}