using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;

namespace PortProject.Api.Domain.ShippingAgentOrganizationAggregate
{
    public sealed class ShippingAgentOrganization
    {
        public OrganizationId? Id { get; private set; }
        public LegalName? LegalName { get; private set; }
        public AlternativeName? AlternativeName { get; private set; }
        public Address? Address { get; private set; }
        public TaxNumber? TaxNumber { get; private set; }

        // Persisted contact fields
        public string Email { get; private set; } = string.Empty;
        public string Phone { get; private set; } = string.Empty;

        private ShippingAgentOrganization() { }

        // Backwards-compatible 5-arg constructor used in many tests
        public ShippingAgentOrganization(OrganizationId id, LegalName legalName, AlternativeName alternativeName, Address address, TaxNumber taxNumber)
            : this(id, legalName, alternativeName, address, taxNumber, string.Empty, string.Empty)
        {
        }

        public ShippingAgentOrganization(OrganizationId id, LegalName legalName, AlternativeName alternativeName, Address address, TaxNumber taxNumber, string email, string phone)
        {
            Id = id ?? throw new ArgumentNullException(nameof(id));
            LegalName = legalName ?? throw new ArgumentNullException(nameof(legalName));
            AlternativeName = alternativeName ?? throw new ArgumentNullException(nameof(alternativeName));
            Address = address ?? throw new ArgumentNullException(nameof(address));
            TaxNumber = taxNumber ?? throw new ArgumentNullException(nameof(taxNumber));
            Email = email ?? string.Empty;
            Phone = phone ?? string.Empty;
        }

        public void UpdateDetails(AlternativeName alternativeName, Address address, string? email = null, string? phone = null)
        {
            if (alternativeName != null) AlternativeName = alternativeName;
            if (address != null) Address = address;
            if (!string.IsNullOrWhiteSpace(email)) Email = email;
            if (!string.IsNullOrWhiteSpace(phone)) Phone = phone;
        }

        public override string ToString() => $"{LegalName} ({TaxNumber})";
    }
}
