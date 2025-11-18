using Microsoft.AspNetCore.Mvc;
using src.Application.Services;
using src.Dto;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PortProject.Api.Domain.VesselAggregate;
using Microsoft.AspNetCore.Authorization;

namespace PortProject.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrator,PortAuthorityOfficer")]
    public class VesselController : ControllerBase
    {
        private readonly IVesselService _service;

        public VesselController(IVesselService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<ActionResult<VesselDto>> CreateVessel([FromBody] VesselCreateDto dto)
        {
            try
            {
                var created = await _service.CreateVesselAsync(dto);
                return CreatedAtAction(nameof(GetVesselByImo), new { imo = created.ImoNumber }, created);
            }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
            catch (Exception ex) { return StatusCode(500, new { message = "Error creating vessel.", details = ex.Message }); }
        }

        [HttpPut("{imo}")]
        public async Task<ActionResult<VesselDto>> UpdateVessel(string imo, [FromBody] VesselDto dto)
        {
            try
            {
                if (imo != dto.ImoNumber)
                    return BadRequest(new { message = "IMO number in URL and body do not match." });

                var updated = await _service.UpdateVesselAsync(dto);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
            catch (Exception ex) { return StatusCode(500, new { message = "Error updating vessel.", details = ex.Message }); }
        }

        [HttpGet("{imo}")]
        public async Task<ActionResult<VesselDto>> GetVesselByImo(string imo)
        {
            try
            {
                var vessel = await _service.GetVesselByImoAsync(imo);
                if (vessel == null)
                    return NotFound(new { message = $"Vessel with IMO '{imo}' not found." });

                return Ok(vessel);
            }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
            catch (Exception ex) { return StatusCode(500, new { message = "Error retrieving vessel.", details = ex.Message }); }
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<VesselDto>>> SearchVessels([FromQuery] string? imo, [FromQuery] string? name, [FromQuery] string? operatorName)
        {
            try
            {
                var vessels = await _service.SearchVesselsAsync(imo, name, operatorName);
                return Ok(vessels);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error searching vessels.", details = ex.Message });
            }
        }

        [HttpDelete("{imo}")]
        public async Task<IActionResult> DeleteVessel(string imo)
        {
            try
            {
                await _service.DeleteVesselAsync(imo);
                return NoContent();
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
            catch (Exception ex) { return StatusCode(500, new { message = "Error deleting vessel.", details = ex.Message }); }
        }
    }
}
