using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.Dock.DTOs;
using PortProject.Api.Application.Dock.Services;
using Microsoft.AspNetCore.Authorization;

namespace PortProject.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrator,PortAuthorityOfficer")]
    public class DockController : ControllerBase
    {
        private readonly IDockService _service;

        public DockController(IDockService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> CreateDock([FromBody] DockCreateDto dto)
        {
            try
            {
                var result = await _service.CreateDockAsync(dto);
                return CreatedAtAction(nameof(GetDockById), new { id = result.Id }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro inesperado: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDock(string id, [FromBody] DockDto dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest("Dock data is required.");

                if (id != dto.Id)
                    return BadRequest("ID mismatch between route and body.");

                var updated = await _service.UpdateDockAsync(dto);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Unexpected error: {ex.Message}");
            }
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<DockDto>> GetDockById(string id)
        {
            var dock = await _service.GetDockByIdAsync(id);
            if (dock == null)
                return NotFound(new { message = $"Dock with ID '{id}' not found." });

            return Ok(dock);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DockDto>>> GetAllDocks()
        {
            var docks = await _service.GetAllDocksAsync();
            return Ok(docks);
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<DockDto>>> SearchDock(
            [FromQuery] string? name,
            [FromQuery] string? vesselTypeId,
            [FromQuery] string? zone,
            [FromQuery] string? section,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortBy = "name",
            [FromQuery] string? sortOrder = "asc")
        {
            var results =
                await _service.SearchDocksAsync(name, vesselTypeId, zone, section, page, pageSize, sortBy, sortOrder);
            return Ok(results);
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDock(string id)
        {
            try
            {
                await _service.DeleteDockAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Unexpected error: {ex.Message}");
            }
        }
    }
}
