using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortProject.Api.Application.VesselVisitNotification;
using PortProject.Api.Application.VesselVisitNotification.DTOs;
using PortProject.Api.Application.VesselVisitNotification.Services;
using Microsoft.AspNetCore.Authorization;

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
    [Authorize(Roles = "Administrator,ShippingAgentRepresentative")]
    public async Task<ActionResult<VesselVisitNotificationDto>> Create(CreateVvnDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.RepresentativeCitizenId)) 
            {
                return BadRequest(new { message = "RepresentativeCitizenId is required in the request body." });
            }
            var resultDto = await _service.CreateAsync(dto, null);
            return CreatedAtRoute("GetNotificationById", new { businessId = resultDto.BusinessId }, resultDto);
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
    [HttpPut("{businessId}")]
    [Authorize(Roles = "Administrator,ShippingAgentRepresentative")]
    public async Task<ActionResult<VesselVisitNotificationDto>> Update(string businessId, CreateVvnDto dto)
    {
        try {
            var result = await _service.UpdateAsync(businessId, dto);
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
    [HttpPatch("{businessId}/submit")]
    [Authorize(Roles = "Administrator,ShippingAgentRepresentative")]
    public async Task<IActionResult> Submit(string businessId)
    {
        try {
            await _service.SubmitAsync(businessId);
            return NoContent();
        } catch (KeyNotFoundException ex) {
            return NotFound(ex.Message);
        }
        
        catch (InvalidOperationException ex) // Catches business rule violations (e.g. wrong status)
        {
            return Conflict(new { message = ex.Message }); // 409 Conflict
        }
    }
    [HttpPatch("{businessId}/approve")]
    [Authorize(Roles = "Administrator,PortAuthorityOfficer")]
    public async Task<IActionResult> ApproveVvn(string businessId, [FromBody] ApproveVvnDto dto)
    {
        try
        {
            var result = await _service.ApproveAsync(businessId, dto);
            return Ok(result);
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
            return BadRequest(new { message = $"Cannot approve notification: {ex.Message}" });
        }
    }

    [HttpPatch("{businessId}/reject")]
    [Authorize(Roles = "Administrator,PortAuthorityOfficer")]
    public async Task<IActionResult> RejectVvn(string businessId, [FromBody] RejectVvnDto dto)
    {
        try
        {
            var result = await _service.RejectAsync(businessId, dto);
            return NoContent(); // ✅ devolve 204 como esperado no teste
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


    [HttpPatch("{businessId}/resubmit")]
    [Authorize(Roles = "Administrator,PortAuthorityOfficer")]
    public async Task<IActionResult> ReopenVvn(string businessId)
    {
        try
        {
            await _service.ReopenAsync(businessId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = $"Cannot resubmit notification: {ex.Message}" });
        }
    }
    
    [HttpGet("search")]
    [Authorize(Roles = "Administrator,ShippingAgentRepresentative,PortAuthorityOfficer,LogisticsOperator")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> Search(
        [FromQuery] string? vesselImo,
        [FromQuery] string? status,
        [FromQuery] string? representativeId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var results = await _service.SearchAsync(vesselImo, status, representativeId, from, to);
        return Ok(results);
    }
    
    [HttpPost("representative-notifications")]
    public async Task<ActionResult<List<VesselVisitNotificationDto>>> GetNotificationsForRepresentative([FromBody] VvnSearchFilterDto filter)
    {
        var results = await _service.GetNotificationsForRepresentativeAsync(filter);
        return Ok(results);
    }


// Helper endpoint to get a notification by its ID
    [HttpGet("{businessId}", Name = "GetNotificationById")]
    public async Task<ActionResult<VesselVisitNotificationDto>> GetById(string businessId)
    {
        try
        {
            var result = await _service.GetByBusinessIdAsync(businessId);
            if (result == null)
            {
                return NotFound($"Notification with ID '{businessId}' not found.");
            }
            return Ok(result);
        }
        catch (FormatException)
        {
            return BadRequest("Invalid Notification ID format. Please provide a valid GUID.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Unexpected Error in GetById: {ex}");
            return StatusCode(500, "An unexpected error occurred while retrieving the notification.");
        }
    }
}