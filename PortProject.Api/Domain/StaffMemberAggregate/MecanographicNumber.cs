using System.ComponentModel.DataAnnotations;

namespace PortProject.Api.Domain.StaffMemberAggregate
{
    // Value Object for Mecanographic Number
    public record MecanographicNumber
    {
        public string Value { get; }

        public MecanographicNumber(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Mecanographic number cannot be null or empty.", nameof(value));
            
            // Add any specific validation rules for mecanographic numbers here
            if (value.Length < 3 || value.Length > 20)
                throw new ArgumentException("Mecanographic number must be between 3 and 20 characters.", nameof(value));
            
            Value = value.Trim().ToUpperInvariant();
        }

        public override string ToString() => Value;

        // Implicit conversion to string for convenience
        public static implicit operator string(MecanographicNumber mecanographicNumber) => mecanographicNumber.Value;
    }
}
