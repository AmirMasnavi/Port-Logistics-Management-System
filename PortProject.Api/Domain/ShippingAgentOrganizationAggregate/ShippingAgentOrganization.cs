

using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;

namespace PortProject.Api.Domain.ShippingAgentOrganizationAggregate
{
    /// <summary>
    /// Aggregate Root que representa uma organização de agente de navegação.
    /// </summary>
    public sealed class ShippingAgentOrganization
    {
    public OrganizationId? Id { get; private set; }
    public LegalName? LegalName { get; private set; }
    public AlternativeName? AlternativeName { get; private set; }
    public Address? Address { get; private set; }
    public TaxNumber? TaxNumber { get; private set; }
    public List<ShippingAgentRepresentative> Representatives { get; private set;  }

        // 🔒 Construtor privado exigido pelo EF Core
        private ShippingAgentOrganization()
        {
            Representatives = new List<ShippingAgentRepresentative>();
        }

        public ShippingAgentOrganization(
            OrganizationId id,
            LegalName legalName,
            AlternativeName alternativeName,
            Address address,
            TaxNumber taxNumber)
        {
            Id = id ?? throw new ArgumentNullException(nameof(id), "Organization ID is required.");
            LegalName = legalName ?? throw new ArgumentNullException(nameof(legalName), "Legal name is required.");
            AlternativeName = alternativeName ?? throw new ArgumentNullException(nameof(alternativeName), "Alternative name is required.");
            Address = address ?? throw new ArgumentNullException(nameof(address), "Address is required.");
            TaxNumber = taxNumber ?? throw new ArgumentNullException(nameof(taxNumber), "Tax number is required.");
            Representatives = new List<ShippingAgentRepresentative>();
        }

        public void AddRepresentative(ShippingAgentRepresentative representative)
        {
            if (representative == null)
                throw new ArgumentNullException(nameof(representative));
            Representatives.Add(representative);
        }

        /// <summary>
        /// Atualiza dados básicos da organização (exemplo para futuras US).
        /// </summary>
        public void UpdateDetails(AlternativeName alternativeName, Address address)
        {
            if (alternativeName != null)
                AlternativeName = alternativeName;
            if (address != null)
                Address = address;
        }

        public override string ToString() => $"{LegalName} ({TaxNumber})";
    }
}