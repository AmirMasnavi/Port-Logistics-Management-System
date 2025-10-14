using src.Domain.Shared;

namespace PortProject.Api.Domain.DockAggregate
{
    public class NumberOfSTSCranes : IValueObject
    {
        public int Value { get; private set; }

        public NumberOfSTSCranes(int value)
        {
            if (value < 0)
                throw new ArgumentException("O número de gruas STS não pode ser negativo.", nameof(value));

            Value = value;
        }

        protected NumberOfSTSCranes() { }

        public override bool Equals(object obj)
        {
            if (obj == null || GetType() != obj.GetType())
                return false;

            var other = (NumberOfSTSCranes)obj;
            return Value == other.Value;
        }

        public override int GetHashCode()
        {
            return Value.GetHashCode();
        }

        public override string ToString()
        {
            return $"{Value} STS Crane(s)";
        }
    }
}