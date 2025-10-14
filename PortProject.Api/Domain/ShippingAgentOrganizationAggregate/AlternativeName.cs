
using System.Text.RegularExpressions;

namespace PortProject.Api.Domain.ShippingAgentOrganizationAggregate
{
    public sealed class AlternativeName
    {
        public string Value { get; private set; } = string.Empty;

        // EF Core precisa de um construtor sem parâmetros
        private AlternativeName() { }  // ✅ agora não dá warning

        public AlternativeName(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("The alternative name cannot be empty.", nameof(value));

            if (value.Length < 3 || value.Length > 100)
                throw new ArgumentException("The alternative name must contain between 3 and 100 characters.", nameof(value));

            if (!Regex.IsMatch(value, @"^[A-Za-z0-9\\s.,&'()-]+$"))
                throw new ArgumentException("The alternative name contains invalid characters.", nameof(value));

            Value = value.Trim();
        }

        public override string ToString() => Value;

        public override bool Equals(object? obj)
        {
            if (obj is not AlternativeName other)
                return false;
            return string.Equals(Value, other.Value, StringComparison.OrdinalIgnoreCase);
        }

        public override int GetHashCode() => Value.ToLowerInvariant().GetHashCode();
    }
}