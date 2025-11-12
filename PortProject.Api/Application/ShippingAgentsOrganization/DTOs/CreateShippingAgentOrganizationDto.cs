using System.ComponentModel.DataAnnotations;
using System.ComponentModel;

namespace PortProject.Api.Application.ShippingAgentsOrganization.DTOs
{
    public sealed class CreateShippingAgentOrganizationDto
    {
        public string LegalName { get; set; } = string.Empty;
        public string AlternativeName { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required for the organization.")]
        [EmailAddress(ErrorMessage = "Invalid email format.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone is required for the organization.")]
        [RegularExpression(@"^9\d{8}$", ErrorMessage = "Phone must start with 9 and have 9 digits.")]
        public string Phone { get; set; } = string.Empty;
        
        [DefaultValue("351123456789")]
        public string TaxNumber { get; set; } = string.Empty;
        public List<CreateShippingAgentRepresentativeForOrganizationDto> Representatives { get; set; } = new();
    }

}