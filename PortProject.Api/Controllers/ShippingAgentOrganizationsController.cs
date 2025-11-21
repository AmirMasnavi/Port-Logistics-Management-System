using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Application.ShippingAgentsOrganization.Services;

namespace PortProject.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShippingAgentOrganizationsController : ControllerBase
    {
        private readonly IShippingAgentOrganizationService _service;

        public ShippingAgentOrganizationsController(IShippingAgentOrganizationService service)
        {
            _service = service;
        }

        /// <summary>
        /// Creates a new Shipping Agent Organization.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<string>> CreateOrganization(CreateShippingAgentOrganizationDto dto)
        {
            try
            {
                var id = await _service.RegisterOrganizationAsync(dto);
                // Return 201 Created with the created resource id in the response body (integration tests expect a GUID)
                return CreatedAtAction(nameof(GetOrganizationById), new { id }, id);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                // Known domain/service validation errors -> 400 Bad Request with message
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                // Unexpected errors -> return 500 with message to help debugging (can be removed in production)
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Retrieves a Shipping Agent Organization by its ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ShippingAgentOrganizationDto>> GetOrganizationById(Guid id)
        {
            var resultDto = await _service.GetByIdAsync(id);
            if (resultDto == null)
            {
                return NotFound($"Organization with ID {id} not found.");
            }
            return Ok(resultDto);
        }

        /// <summary>
        /// Gets all Shipping Agent Organizations.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ShippingAgentOrganizationDto>>> GetAllOrganizations()
        {
            var resultDtos = await _service.GetAllAsync();
            return Ok(resultDtos);
        }

        /// <summary>
        /// Adds a new representative to an existing Shipping Agent Organization.
        /// </summary>
     //   [HttpPost("{organizationId}/representatives")]
       // public async Task<ActionResult<ShippingAgentRepresentativeDto>> AddRepresentativeToOrganization(string organizationId, CreateShippingAgentRepresentativeDto dto)
        //{
        //     try
        //     {
        //         // Add representative using service
        //         var repDto = await _service.AddRepresentativeToOrganizationAsync(organizationId, dto);
        //         return CreatedAtAction(nameof(GetOrganizationById), new { id = organizationId }, repDto);
        //     }
        //     catch (ArgumentException ex)
        //     {
        //         return BadRequest(new { message = ex.Message });
        //     }
        //     catch (KeyNotFoundException ex)
        //     {
        //         return NotFound(new { message = ex.Message });
        //     }
        // }

        // /// <summary>
        // /// Gets all representatives for a specific organization.
        // /// </summary>
        // [HttpGet("{organizationId}/representatives")]
        // public async Task<ActionResult<IEnumerable<ShippingAgentRepresentativeDto>>> GetRepresentativesForOrganization(string organizationId)
        // {
        //     // This endpoint should query representatives by organizationId, not from the org DTO
        //     return StatusCode(501, "Not implemented: Query representatives by organizationId directly.");
        // }
    }
}
