using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Models;
using PortProject.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace PortProject.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class VesselTypesController : ControllerBase
    {
        private readonly PortProjectContext _context;

        public VesselTypesController(PortProjectContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<VesselType>>> GetAll()
        {
            var vesselTypes = await _context.VesselTypes.ToListAsync();
            return Ok(vesselTypes);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<VesselType>> GetById(int id)
        {
            var vt = await _context.VesselTypes.FindAsync(id);
            if (vt == null)
                return NotFound();
            return Ok(vt);
        }

        [HttpPost]
        public async Task<ActionResult<VesselType>> Create(VesselType vesselType)
        {
            _context.VesselTypes.Add(vesselType);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = vesselType.Id }, vesselType);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, VesselType updated)
        {
            var vt = await _context.VesselTypes.FindAsync(id);
            if (vt == null) return NotFound();

            vt.Name = updated.Name;
            vt.Description = updated.Description;
            vt.Capacity = updated.Capacity;
            vt.MaxRows = updated.MaxRows;
            vt.MaxBays = updated.MaxBays;
            vt.MaxTiers = updated.MaxTiers;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var vt = await _context.VesselTypes.FindAsync(id);
            if (vt == null) return NotFound();
            _context.VesselTypes.Remove(vt);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}