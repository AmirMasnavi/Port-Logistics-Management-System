using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.Dock.DTOs;
using PortProject.Api.Application.Dock.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PortProject.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DockController : ControllerBase
    {
        private readonly IDockService _service;

        public DockController(IDockService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<ActionResult<DockDto>> CreateDock([FromBody] DockCreateDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Body inválido." });

            var created = await _service.CreateDockAsync(dto);
            return CreatedAtAction(nameof(GetDockById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<DockDto>> UpdateDock(string id, [FromBody] DockDto dto)
        {
            dto.Id = id; // força o ID do corpo a ser igual ao da URL

            var updated = await _service.UpdateDockAsync(dto);
            return Ok(updated);
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
            var results = await _service.SearchDocksAsync(name, vesselTypeId, zone, section, page, pageSize, sortBy, sortOrder);
            return Ok(results);
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDock(string id)
        {
            await _service.DeleteDockAsync(id);
            return NoContent();
        }
    }
}
