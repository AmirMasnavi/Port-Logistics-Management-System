using System.ComponentModel.DataAnnotations;
using System.ComponentModel;
using System.Text.Json.Serialization;

namespace PortProject.Api.Application.ShippingAgentsOrganization.DTOs
{
    public sealed class CreateShippingAgentRepresentativeDto
    {

        [Required, StringLength(120, MinimumLength = 2)]
        public string RepresentativeName { get; set; } = string.Empty;

        [Required, StringLength(50, MinimumLength = 2)]
        public string CitizenId { get; set; } = string.Empty;

        [Required, StringLength(60, MinimumLength = 2)]
        public string RepresentativeNationality { get; set; } = string.Empty;

        [Required, EmailAddress, StringLength(120)]
        public string RepresentativeEmail { get; set; } = string.Empty;

        // Aceita formatos internacionais simples (+351..., etc.)
        [Required, Phone, StringLength(40)]
        [DefaultValue("+351912345678")]
        public string RepresentativePhone { get; set; } = string.Empty;

        // OrganizationId is optional here - required only for direct POST to representatives endpoint
        // When creating reps as part of organization registration, it's set automatically
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public string OrganizationId { get; set; } = string.Empty;
    }
}