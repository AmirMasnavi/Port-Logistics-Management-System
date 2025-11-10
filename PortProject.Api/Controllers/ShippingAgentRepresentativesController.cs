using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Application.ShippingAgentsRepresentative.Services;
using PortProject.Api.Application.ShippingAgentsOrganization.Services;

namespace PortProject.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShippingAgentRepresentativesController : ControllerBase
    {
        private readonly IShippingAgentRepresentativeService _service;
        private readonly IShippingAgentOrganizationService _orgService;

        public ShippingAgentRepresentativesController(IShippingAgentRepresentativeService service, IShippingAgentOrganizationService orgService)
        {
            _service = service;
            _orgService = orgService;
        }

        /// <summary>
    /// Creates a new Shipping Agent Representative. Requires OrganizationName in the request body.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<string>> CreateRepresentative(CreateShippingAgentRepresentativeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.OrganizationName))
                return BadRequest(new { message = "OrganizationName is required to create a representative." });

            try
            {
                var representative = await _service.CreateRepresentativeAsync(dto);
                return CreatedAtAction(nameof(GetRepresentativeById), new { id = representative.RepresentativeId?.Value.ToString() }, $"{representative.RepresentativeName?.Value} registered successfully!");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Updates a Shipping Agent Representative.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ShippingAgentRepresentativeDto>> UpdateRepresentative(string id, [FromBody] CreateShippingAgentRepresentativeDto dto)
        {
            var updated = await _service.UpdateRepresentativeAsync(id, dto);
            if (updated == null)
                return NotFound($"Representative with ID {id} not found.");
            return Ok(updated);
        }

        /// <summary>
        /// Deletes a Shipping Agent Representative.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRepresentative(string id)
        {
            var deleted = await _service.DeleteRepresentativeAsync(id);
            if (!deleted)
                return NotFound($"Representative with ID {id} not found.");
            return NoContent();
        }

        /// <summary>
        /// Retrieves a Shipping Agent Representative by their ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ShippingAgentRepresentativeDto>> GetRepresentativeById(string id)
        {
            var resultDto = await _service.GetByIdAsync(id);
            if (resultDto == null)
            {
                return NotFound($"Representative with ID {id} not found.");
            }
            return Ok(resultDto);
        }

        /// <summary>
        /// Gets all Shipping Agent Representatives.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RepresentativeSimpleDto>>> GetAllRepresentatives()
        {
            var resultDtos = await _service.GetAllSimplifiedAsync();
            return Ok(resultDtos);
        }

        // <summary>
        // Gets all Shipping Agent Representatives by OrganizationId.
        // </summary>
        [HttpGet("by-organization/{organizationId}")]
        public async Task<ActionResult<IEnumerable<RepresentativeSimpleDto>>> GetRepresentativesByOrganizationId(string organizationId)
        {
            var resultDtos = await _service.GetSimplifiedByOrganizationIdAsync(organizationId);
            return Ok(resultDtos);
        }
    }
}
