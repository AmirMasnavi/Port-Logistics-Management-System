using System.ComponentModel.DataAnnotations;
using System.ComponentModel;

namespace PortProject.Api.Application.ShippingAgentsOrganization.DTOs
{
    /// <summary>
    /// DTO for creating a representative as part of an organization registration.
    /// OrganizationName is not required since it will be inferred from the parent organization.
    /// </summary>
    public sealed class CreateShippingAgentRepresentativeForOrganizationDto
    {
        [Required, StringLength(120, MinimumLength = 3)]
        public string RepresentativeName { get; set; } = string.Empty;

        [Required, StringLength(50, MinimumLength = 2)]
        public string CitizenId { get; set; } = string.Empty;

        [Required, StringLength(60, MinimumLength = 2)]
        public string RepresentativeNationality { get; set; } = string.Empty;

        [Required, EmailAddress, StringLength(120)]
        public string RepresentativeEmail { get; set; } = string.Empty;

        [Required, Phone, StringLength(40)]
        public string RepresentativePhone { get; set; } = string.Empty;
    }
}
