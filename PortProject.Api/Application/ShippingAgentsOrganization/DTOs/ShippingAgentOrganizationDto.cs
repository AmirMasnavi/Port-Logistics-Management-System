namespace PortProject.Api.Application.ShippingAgentsOrganization.DTOs
{
    public sealed class ShippingAgentOrganizationDto
    {
        // Include the organization id so frontends can key and link entities
        public string LegalName { get; set; } = string.Empty;
        public string AlternativeName { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string TaxNumber { get; set; } = string.Empty;
    }

}