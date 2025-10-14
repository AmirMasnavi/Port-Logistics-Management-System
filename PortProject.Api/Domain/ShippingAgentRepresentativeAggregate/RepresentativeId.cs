namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    public sealed class RepresentativeId
    {
        public Guid Value { get; }

        public RepresentativeId(Guid value)
        {
            if (value == Guid.Empty)
                throw new ArgumentException("RepresentativeId cannot be empty.", nameof(value));
            Value = value;
        }

        public static RepresentativeId NewId() => new RepresentativeId(Guid.NewGuid());

        public override bool Equals(object obj) => obj is RepresentativeId other && Value.Equals(other.Value);
        public override int GetHashCode() => Value.GetHashCode();
        public override string ToString() => Value.ToString();

    }
}
