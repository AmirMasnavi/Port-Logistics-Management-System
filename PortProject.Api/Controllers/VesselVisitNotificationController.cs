using System.Security.Claims;
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
        try
        {
            if (string.IsNullOrWhiteSpace(dto.RepresentativeId))
            {
                return BadRequest(new { message = "RepresentativeId is required in the request body." });
            }
            var resultDto = await _service.CreateAsync(dto, dto.RepresentativeId);
            return CreatedAtAction(nameof(GetById), new { id = resultDto.Id }, resultDto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (FormatException ex) // Handles invalid GUID format if RepresentativeId was still wrong
        {
            return BadRequest(new { message = $"Invalid Representative ID format provided: {ex.Message}" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Unexpected Error: {ex}");
            return StatusCode(500, "An unexpected error occurred.");
        }
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
        try
        {
            var result = await _service.GetByIdAsync(id);
            if (result == null)
            {
                return NotFound($"Notification with ID '{id}' not found.");
            }
            return Ok(result);
        }
        catch (FormatException) // Handle if the provided 'id' string is not a valid GUID
        {
            return BadRequest("Invalid Notification ID format. Please provide a valid GUID.");
        }
        catch (Exception ex) // Catch unexpected errors
        {
            Console.WriteLine($"Unexpected Error in GetById: {ex}"); // Replace with proper logging
            return StatusCode(500, "An unexpected error occurred while retrieving the notification.");
        }
    }
}