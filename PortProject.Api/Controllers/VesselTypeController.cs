using src.Application.Services;

namespace PortProject.Api.Controllers;

using Microsoft.AspNetCore.Mvc;

using src.Dto;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;


    [Route("api/[controller]")]
    [ApiController]
    public class VesselTypeController : ControllerBase
    {
        private readonly IVesselTypeService _service;

        public VesselTypeController(IVesselTypeService service)
        {
            _service = service;
        }

        /// <summary>
        /// Creates a new Vessel Type.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<VesselTypeDto>> CreateVesselType([FromBody] VesselTypeCreateDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Body inválido." });

            // Mapeia para o DTO usado internamente no serviço (Id será gerado no serviço)
            var created = await _service.CreateVesselTypeAsync(new VesselTypeDto
            {
                Name = dto.Name,
                Description = dto.Description,
                Capacity = dto.Capacity,
                MaxRows = dto.MaxRows,
                MaxBays = dto.MaxBays,
                MaxTiers = dto.MaxTiers
            });

            return CreatedAtAction(nameof(GetVesselTypeById), new { id = created.Id }, created);
        }

        /// <summary>
        /// Updates an existing Vessel Type.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<VesselTypeDto>> UpdateVesselType(string id, [FromBody] VesselTypeDto vesselTypeDto)
        {
            try
            {
                if (id != vesselTypeDto.Id)
                {
                    return BadRequest(new { message = "ID in URL and body do not match." });
                }

                var updatedVesselType = await _service.UpdateVesselTypeAsync(vesselTypeDto);
                return Ok(updatedVesselType);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message }); 
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the vessel type.", details = ex.Message });
            }
        }

        /// <summary>
        /// Gets a Vessel Type by its ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<VesselTypeDto>> GetVesselTypeById(string id)
        {
            try
            {
                var vesselType = await _service.GetVesselTypeByIdAsync(id);
                if (vesselType == null)
                {
                    return NotFound(new { message = $"Vessel Type with ID '{id}' not found." });
                }
                return Ok(vesselType);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the vessel type.", details = ex.Message });
            }
        }

        /// <summary>
        /// Gets all Vessel Types.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VesselTypeDto>>> GetAllVesselTypes()
        {
            try
            {
                var vesselTypes = await _service.GetAllVesselTypesAsync();
                return Ok(vesselTypes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving all vessel types.", details = ex.Message });
            }
        }

        /// <summary>
        /// Searches Vessel Types by name or description.
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<VesselTypeDto>>> SearchVesselTypes([FromQuery] string searchTerm)
        {
            try
            {
                var vesselTypes = await _service.SearchVesselTypesAsync(searchTerm);
                return Ok(vesselTypes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while searching vessel types.", details = ex.Message });
            }
        }

        /// <summary>
        /// Deletes a Vessel Type by its ID.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVesselType(string id)
        {
            try
            {
                await _service.DeleteVesselTypeAsync(id);
                return NoContent(); 
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the vessel type.", details = ex.Message });
            }
        }
    }
