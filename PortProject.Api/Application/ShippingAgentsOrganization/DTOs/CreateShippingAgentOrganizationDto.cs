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
        
        [DefaultValue("351123456789")]
        public string TaxNumber { get; set; } = string.Empty;
        public List<CreateShippingAgentRepresentativeForOrganizationDto> Representatives { get; set; } = new();
    }

}