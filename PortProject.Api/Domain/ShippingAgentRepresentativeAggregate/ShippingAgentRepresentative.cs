using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;

namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    public sealed class ShippingAgentRepresentative
    {
        public RepresentativeId RepresentativeId { get; private set; }

        // ✅ FK explícita (não nula)
        public OrganizationId OrganizationId { get; private set; }

        public CitizenId CitizenId { get; private set; }
        public RepresentativeName RepresentativeName { get; private set; }
        public RepresentativeEmail RepresentativeEmail { get; private set; }
        public RepresentativePhone RepresentativePhone { get; private set; }
        public RepresentativeNationality RepresentativeNationality { get; private set; }

        private ShippingAgentRepresentative() { } // EF

        public ShippingAgentRepresentative(
            CitizenId citizenId,
            RepresentativeName representativeName,
            RepresentativePhone representativePhone,
            RepresentativeNationality representativeNationality,
            RepresentativeEmail representativeEmail)
        {
            RepresentativeId = RepresentativeId.NewId();
            CitizenId = citizenId ?? throw new ArgumentNullException(nameof(citizenId));
            RepresentativeName = representativeName ?? throw new ArgumentNullException(nameof(representativeName));
            RepresentativePhone = representativePhone ?? throw new ArgumentNullException(nameof(representativePhone));
            RepresentativeNationality = representativeNationality ?? throw new ArgumentNullException(nameof(representativeNationality));
            RepresentativeEmail = representativeEmail ?? throw new ArgumentNullException(nameof(representativeEmail));
        }

        // ✅ método interno para a Organização “colar” o representante
        internal void AttachToOrganization(OrganizationId organizationId)
        {
            OrganizationId = organizationId ?? throw new ArgumentNullException(nameof(organizationId));
        }

        public void UpdateDetails(
            CitizenId citizenId,
            RepresentativeName representativeName,
            RepresentativePhone representativePhone,
            RepresentativeNationality representativeNationality,
            RepresentativeEmail representativeEmail)
        {
            CitizenId = citizenId ?? throw new ArgumentNullException(nameof(citizenId));
            RepresentativeName = representativeName ?? throw new ArgumentNullException(nameof(representativeName));
            RepresentativePhone = representativePhone ?? throw new ArgumentNullException(nameof(representativePhone));
            RepresentativeNationality = representativeNationality ?? throw new ArgumentNullException(nameof(representativeNationality));
            RepresentativeEmail = representativeEmail ?? throw new ArgumentNullException(nameof(representativeEmail));
        }
    }
}
