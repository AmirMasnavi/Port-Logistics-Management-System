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


        private ShippingAgentOrganization() { }

        public ShippingAgentOrganization(
            OrganizationId id,
            LegalName legalName,
            AlternativeName alternativeName,
            Address address,
            TaxNumber taxNumber)
        {
            Id = id ?? throw new ArgumentNullException(nameof(id));
            LegalName = legalName ?? throw new ArgumentNullException(nameof(legalName));
            AlternativeName = alternativeName ?? throw new ArgumentNullException(nameof(alternativeName));
            Address = address ?? throw new ArgumentNullException(nameof(address));
            TaxNumber = taxNumber ?? throw new ArgumentNullException(nameof(taxNumber));
        }


        public void UpdateDetails(AlternativeName alternativeName, Address address)
        {
            if (alternativeName != null) AlternativeName = alternativeName;
            if (address != null) Address = address;
        }

        public override string ToString() => $"{LegalName} ({TaxNumber})";
    }
}
