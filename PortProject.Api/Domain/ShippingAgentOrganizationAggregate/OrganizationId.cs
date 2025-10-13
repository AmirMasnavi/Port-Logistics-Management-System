using System;

namespace PortProject.Api.Domain.ShippingAgentOrganizationAggregate
{
    public sealed class OrganizationId : IEquatable<OrganizationId>
    {
        public Guid Value { get; }

        private OrganizationId() { } // EF Core

        public OrganizationId(Guid value)
        {
            if (value == Guid.Empty)
                throw new ArgumentException("OrganizationId cannot be empty", nameof(value));
            Value = value;
        }

        public static OrganizationId NewId() => new OrganizationId(Guid.NewGuid());

        public bool Equals(OrganizationId? other)
        {
            if (ReferenceEquals(null, other)) return false;
            if (ReferenceEquals(this, other)) return true;
            return Value.Equals(other.Value);
        }

        public override bool Equals(object? obj) => Equals(obj as OrganizationId);

        public override int GetHashCode() => Value.GetHashCode();

        public static bool operator ==(OrganizationId? left, OrganizationId? right) =>
            Equals(left, right);

        public static bool operator !=(OrganizationId? left, OrganizationId? right) =>
            !Equals(left, right);

        public override string ToString() => Value.ToString();
    }
}