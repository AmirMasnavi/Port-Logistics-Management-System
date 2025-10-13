using System;

namespace PortProject.Api.Domain.ShippingAgentOrganizationAggregate
{
    /// <summary>
    /// Entidade raiz do agregado (Aggregate Root) que representa
    /// uma organização de agente de navegação.
    /// </summary>
    public sealed class ShippingAgentOrganization
    {
        public OrganizationId Id { get; private set; }
        public string LegalName { get; private set; }
        public string AlternativeName { get; private set; }
        public Address Address { get; private set; }
        public TaxNumber TaxNumber { get; private set; }

        // 🔒 Necessário para o Entity Framework Core
        private ShippingAgentOrganization() { }

        public ShippingAgentOrganization(
            OrganizationId id,
            string legalName,
            string alternativeName,
            Address address,
            TaxNumber taxNumber)
        {
            if (id is null)
                throw new ArgumentNullException(nameof(id), "Organization ID is required.");
            if (string.IsNullOrWhiteSpace(legalName))
                throw new ArgumentException("Legal name is required.", nameof(legalName));
            if (taxNumber is null)
                throw new ArgumentNullException(nameof(taxNumber), "Tax number is required.");

            Id = id;
            LegalName = legalName.Trim();
            AlternativeName = alternativeName?.Trim() ?? string.Empty;
            Address = address ?? Address.Empty;
            TaxNumber = taxNumber;
        }

        /// <summary>
        /// Atualiza dados básicos da organização (opcional para futuras US).
        /// </summary>
        public void UpdateDetails(string alternativeName, Address address)
        {
            AlternativeName = alternativeName?.Trim() ?? AlternativeName;
            Address = address ?? Address;
        }

        public override string ToString() => $"{LegalName} ({TaxNumber})";
    }
}