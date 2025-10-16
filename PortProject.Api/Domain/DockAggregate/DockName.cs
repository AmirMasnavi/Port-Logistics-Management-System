using src.Domain.Shared;

namespace PortProject.Api.Domain.DockAggregate
{
    public class DockName : IValueObject
    {
        public string Value { get; private set; }

        public DockName(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new ArgumentException("Dock name cannot be null or empty.", nameof(value));
            }

            // Verificação adicional: nome deve ter entre 2 e 50 caracteres
            if (value.Length < 2 || value.Length > 50)
            {
                throw new ArgumentException("Dock name must be between 2 and 50 characters.", nameof(value));
            }

            Value = value;
        }

        protected DockName() { }

        public override bool Equals(object obj)
        {
            if (obj == null || GetType() != obj.GetType())
            {
                return false;
            }

            var other = (DockName)obj;
            return Value == other.Value;
        }

        public override int GetHashCode()
        {
            return Value.GetHashCode();
        }

        public override string ToString()
        {
            return Value;
        }
    }
}