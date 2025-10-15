namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    public sealed class RepresentativeNationality
    {
        public string Value { get; private set; }
        
        private RepresentativeNationality() { }

        public RepresentativeNationality(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("CitizenId cannot be empty.", nameof(value));
            Value = value;
        }

        public override int GetHashCode() => Value.GetHashCode();
        public override string ToString() => Value;
    }
}
