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
        public async Task<ActionResult<ShippingAgentRepresentativeDto>> CreateRepresentative(CreateShippingAgentRepresentativeDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.OrganizationName))
                return BadRequest(new { message = "OrganizationName is required to create a representative." });

            try
            {
                var representative = await _service.CreateRepresentativeAsync(dto);

                var createdDto = new ShippingAgentRepresentativeDto
                {
                    RepresentativeId = representative.RepresentativeId.Value.ToString(),
                    OrganizationId = representative.OrganizationId?.Value.ToString() ?? string.Empty,
                    RepresentativeName = representative.RepresentativeName.Value,
                    CitizenId = representative.CitizenId.Value,
                    RepresentativeNationality = representative.RepresentativeNationality.Value,
                    RepresentativeEmail = representative.RepresentativeEmail.Value,
                    RepresentativePhone = representative.RepresentativePhone.Value
                };

                // Usa CreatedAtAction com action alvo que tem parâmetro 'id'
                return CreatedAtAction(nameof(GetRepresentativeById), new { id = createdDto.RepresentativeId }, createdDto);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
            {
                return Conflict(new { message = "Database constraint violation (likely duplicate email or citizen id).", detail = dbEx.InnerException?.Message ?? dbEx.Message });
            }
        }

        /// <summary>
        /// Updates a Shipping Agent Representative by their Citizen ID.
        /// Note: CitizenId cannot be changed during update.
        /// </summary>
        [HttpPut("{citizenId}")]
        public async Task<ActionResult<ShippingAgentRepresentativeDto>> UpdateRepresentative(string citizenId, [FromBody] CreateShippingAgentRepresentativeDto dto)
        {
            try
            {
                var updated = await _service.UpdateRepresentativeByCitizenIdAsync(citizenId, dto);
                if (updated == null)
                    return NotFound($"Representative with Citizen ID {citizenId} not found.");
                return Ok($"Representative with Citizen ID {citizenId} updated successfully");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a Shipping Agent Representative by their Citizen ID.
        /// </summary>
        [HttpDelete("{citizenId}")]
        public async Task<IActionResult> DeleteRepresentative(string citizenId)
        {
            var deleted = await _service.DeleteRepresentativeByCitizenIdAsync(citizenId);
            if (!deleted)
                return NotFound($"Representative with Citizen ID {citizenId} not found.");
            return Ok($"Representative with Citizen ID {citizenId} deleted successfully.");
        }

        /// <summary>
        /// Retrieves a Shipping Agent Representative by their ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ShippingAgentRepresentativeDto>> GetRepresentativeById(string id)
        {
            var resultDto = await _service.GetByCitizenIdAsync(id);
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
