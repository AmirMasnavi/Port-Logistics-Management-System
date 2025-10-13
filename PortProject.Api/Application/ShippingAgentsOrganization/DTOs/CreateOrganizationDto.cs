
using System.ComponentModel.DataAnnotations;

namespace PortProject.Api.Application.ShippingAgentsOrganization.DTOs
{
    public sealed class CreateOrganizationDto
    {
        [Required] public string LegalName { get; set; } = default!;
        public string? AlternativeName { get; set; }
        [Required] public string Address { get; set; } = default!;
        [Required] public string TaxNumber { get; set; } = default!;

        [MinLength(1, ErrorMessage = "At least one representative is required.")]
        public List<RepresentativeItemDto> Representatives { get; set; } = new();
    }
}