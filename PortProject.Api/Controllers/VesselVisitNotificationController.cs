using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.VesselVisitNotification;
using PortProject.Api.Application.VesselVisitNotification.DTOs;
using PortProject.Api.Application.VesselVisitNotification.Services;

namespace PortProject.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public class VesselVisitNotificationController : ControllerBase
{
    private readonly IVesselVisitNotificationService _service;

    public VesselVisitNotificationController(IVesselVisitNotificationService service)
    {
        _service = service;
    }

    // US 2.2.8: Create a new notification
    [HttpPost]
    public async Task<ActionResult<VesselVisitNotificationDto>> Create(CreateVvnDto dto)
    {
        // In a real app, you'd get the representative ID from the user's authentication token (claims)
        var representativeId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
        var result = await _service.CreateAsync(dto, representativeId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    // US 2.2.9: Update a notification
    [HttpPut("{id}")]
    public async Task<ActionResult<VesselVisitNotificationDto>> Update(string id, CreateVvnDto dto)
    {
        try {
            var result = await _service.UpdateAsync(id, dto);
            return Ok(result);
        } catch (KeyNotFoundException ex) {
            return NotFound(ex.Message);
        }
    }
    
    // US 2.2.8: Submit a notification
    [HttpPatch("{id}/submit")]
    public async Task<IActionResult> Submit(string id)
    {
        try {
            await _service.SubmitAsync(id);
            return NoContent();
        } catch (KeyNotFoundException ex) {
            return NotFound(ex.Message);
        }
    }
    [HttpPatch("{id}/approve")]
    public async Task<IActionResult> Approve(string id, [FromBody] ApproveVvnDto dto)
    {
        try {
            await _service.ApproveAsync(id, dto.OfficerId, dto.DockId);
            return NoContent();
        } catch (KeyNotFoundException ex) {
            return NotFound(ex.Message);
        } catch (InvalidOperationException ex) {
            return BadRequest(ex.Message);
        }
    }

    [HttpPatch("{id}/reject")]
    public async Task<IActionResult> Reject(string id, [FromBody] RejectVvnDto dto)
    {
        try {
            await _service.RejectAsync(id, dto.OfficerId, dto.Reason);
            return NoContent();
        } catch (KeyNotFoundException ex) {
            return NotFound(ex.Message);
        } catch (InvalidOperationException ex) {
            return BadRequest(ex.Message);
        }
    }
    [HttpGet("search")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> Search(
        [FromQuery] string? vesselImo,
        [FromQuery] string? status,
        [FromQuery] string? representativeId,
        [FromQuery] string? organizationId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var results = await _service.SearchAsync(vesselImo, status, representativeId, organizationId, from, to);
        return Ok(results);
    }



    // Helper endpoint to get a notification by its ID
    [HttpGet("{id}")]
    public async Task<ActionResult<VesselVisitNotificationDto>> GetById(string id)
    {
        // This method would need to be added to the service
        // var result = await _service.GetByIdAsync(id);
        // if (result == null) return NotFound();
        // return Ok(result);
        return Ok(); // Placeholder
    }
}