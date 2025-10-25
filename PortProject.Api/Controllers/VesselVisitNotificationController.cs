using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        catch (DbUpdateException ex) // Catches database errors
        {
            // Check for specific SQLite FK error (Error 19)
            if (ex.InnerException is Microsoft.Data.Sqlite.SqliteException sqliteEx && sqliteEx.SqliteErrorCode == 19)
            {
                return BadRequest(new { message = "Foreign key constraint failed. Ensure Vessel IMO and Representative ID exist." });
            }
            // Log other DB errors (replace with real logging)
            Console.WriteLine($"DbUpdateException: {ex}");
            return StatusCode(500, "Database error occurred while saving.");
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
        
        catch (InvalidOperationException ex) // Catches business rule violations (e.g. wrong status)
        {
            return Conflict(new { message = ex.Message }); // 409 Conflict is good for state issues
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
        
        catch (InvalidOperationException ex) // Catches business rule violations (e.g. wrong status)
        {
            return Conflict(new { message = ex.Message }); // 409 Conflict
        }
    }
    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveVvn(string id, [FromBody] ApproveVvnDto dto)
    {
        try
        {
            var result = await _service.ApproveAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = $"Cannot approve notification: {ex.Message}" });
        }
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectVvn(string id, [FromBody] RejectVvnDto dto)
    {
        try
        {
            var result = await _service.RejectAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = $"Cannot reject notification: {ex.Message}" });
        }
    }


    [HttpPatch("{id}/reopen")]
    public async Task<IActionResult> ReopenVvn(string id)
    {
        try
        {
            var result = await _service.ReopenAsync(id);
            if (result == null)
                return NotFound(new { message = $"Notification {id} not found or not rejected." });

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = $"Cannot reopen notification: {ex.Message}" });
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
        var results = await _service.SearchAsync(vesselImo, status, representativeId, from, to);
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