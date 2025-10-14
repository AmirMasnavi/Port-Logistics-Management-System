

using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;

namespace PortProject.Api.Domain.ShippingAgentRepresentativeAggregate
{
    /// <summary>
    /// Aggregate Root que representa uma organização de agente de navegação.
    /// </summary>
    public sealed class ShippingAgentRepresentative
    {
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
        public RepresentativeId RepresentativeId { get; private set; }
        public CitizenId CitizenId { get; private set; }
        public RepresentativeName RepresentativeName { get; private set; }
        public RepresentativeEmail RepresentativeEmail { get; private set; }
        public RepresentativePhone RepresentativePhone { get; private set; }
        public RepresentativeNationality RepresentativeNationality { get; private set; }

        // 🔒 Construtor privado exigido pelo EF Core
        private ShippingAgentRepresentative() { }

        public ShippingAgentRepresentative(
            CitizenId citizenId,
            RepresentativeName representativeName,
            RepresentativePhone representativePhone,
            RepresentativeNationality represenativeNationality,
            RepresentativeEmail representativeEmail)
            
        {
            RepresentativeId = RepresentativeId.NewId();
            CitizenId = citizenId ?? throw new ArgumentNullException(nameof(citizenId), "Citizen ID is required.");
            RepresentativeName = representativeName ?? throw new ArgumentNullException(nameof(representativeName), "Representative name is required.");
            RepresentativePhone = representativePhone ?? throw new ArgumentNullException(nameof(representativePhone), "Representative phone number is required.");
            RepresentativeNationality = represenativeNationality ?? throw new ArgumentNullException(nameof(represenativeNationality), "Representative nationality is required.");
            RepresentativeEmail = representativeEmail ?? throw new ArgumentNullException(nameof(representativeEmail), "Representative email is required.");
        }
    }
}

        /// <summary>
        /// Atualiza dados básicos da organização (exemplo para futuras US).
        /// </summary>
//         public void UpdateDetails(AlternativeName alternativeName, Address address)
//         {
//             if (alternativeName != null)
//                 AlternativeName = alternativeName;
//             if (address != null)
//                 Address = address;
//         }

//         public override string ToString() => $"{LegalName} ({TaxNumber})";
//     }
// }