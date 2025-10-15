namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    public sealed class CitizenId
    {
        public string Value { get; private set; }
        
        private CitizenId() { }

        public CitizenId(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("CitizenId cannot be empty.", nameof(value));
            Value = value;
        }

        public override bool Equals(object obj) => obj is CitizenId other && Value.Equals(other.Value);
        public override int GetHashCode() => Value.GetHashCode();
        public override string ToString() => Value;
    }
}
