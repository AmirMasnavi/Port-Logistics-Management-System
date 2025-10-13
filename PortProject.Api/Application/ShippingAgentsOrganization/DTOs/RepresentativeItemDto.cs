using System.ComponentModel.DataAnnotations;

namespace PortProject.Api.Application.ShippingAgentsOrganization.DTOs
{
    public sealed class RepresentativeItemDto
    {
        [Required] public string Name { get; set; } = default!;
        [Required] public string CitizenId { get; set; } = default!;
        [Required] public string Nationality { get; set; } = default!;
        [Required, EmailAddress] public string Email { get; set; } = default!;
        [Required] public string Phone { get; set; } = default!;
    }
}