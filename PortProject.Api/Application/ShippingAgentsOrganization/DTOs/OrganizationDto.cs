
namespace PortProject.Api.Application.ShippingAgentsOrganization.DTOs
{
    public sealed class OrganizationDto
    {
        public Guid Id { get; init; }
        public string LegalName { get; init; } = default!;
        public string AlternativeName { get; init; } = default!;
        public string Address { get; init; } = default!;
        public string TaxNumber { get; init; } = default!;
        public List<ShippingAgentRepresentativeDto> Representatives { get; init; } = new();
    }
}