namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    public sealed class RepresentativeName
    {
        public string Value { get; }

        public RepresentativeName(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("RepresentativeName cannot be empty.", nameof(value));
            Value = value;
        }

        public override bool Equals(object obj) => obj is RepresentativeName other && Value.Equals(other.Value);
        public override int GetHashCode() => Value.GetHashCode();
        public override string ToString() => Value;
    }
}
