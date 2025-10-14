using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Application.ShippingAgentsRepresentative.Services;

namespace PortProject.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShippingAgentRepresentativesController : ControllerBase
    {
        private readonly IShippingAgentRepresentativeService _service;

        public ShippingAgentRepresentativesController(IShippingAgentRepresentativeService service)
        {
            _service = service;
        }

        /// <summary>
        /// Creates a new Shipping Agent Representative.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ShippingAgentRepresentativeDto>> CreateRepresentative(CreateShippingAgentRepresentativeDto dto)
        {
            var resultDto = await _service.CreateRepresentativeAsync(dto);
            return CreatedAtAction(nameof(GetRepresentativeById), new { id = resultDto.RepresentativeId }, resultDto);
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
        public async Task<ActionResult<IEnumerable<ShippingAgentRepresentativeDto>>> GetAllRepresentatives()
        {
            var resultDtos = await _service.GetAllAsync();
            return Ok(resultDtos);
        }

        /// <summary>
        /// Gets all Shipping Agent Representatives by OrganizationId.
        /// </summary>
        // [HttpGet("by-organization/{organizationId}")]
        // public async Task<ActionResult<IEnumerable<ShippingAgentRepresentativeDto>>> GetRepresentativesByOrganizationId(string organizationId)
        // {
        //     var resultDtos = await _service.GetAllByOrganizationIdAsync(organizationId);
        //     return Ok(resultDtos);
        // }
    }
}
