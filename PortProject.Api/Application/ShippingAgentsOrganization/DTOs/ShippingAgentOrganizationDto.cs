namespace PortProject.Api.Application.ShippingAgentsOrganization.DTOs
{
    public sealed class ShippingAgentOrganizationDto
    {
        // Include the organization id so frontends can key and link entities
        public string Id { get; set; } = string.Empty;
        public string LegalName { get; set; } = string.Empty;
        public string AlternativeName { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        // Contact details (new)
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string TaxNumber { get; set; } = string.Empty;
    }

}