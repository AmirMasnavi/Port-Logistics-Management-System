using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.StaffMembers.DTOs;
using PortProject.Api.Application.StaffMembers.Services;

namespace PortProject.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StaffMembersController : ControllerBase
{
    // Inject the SERVICE INTERFACE, not the concrete class.
    private readonly IStaffMemberService _staffMemberService;

    public StaffMembersController(IStaffMemberService staffMemberService)
    {
        _staffMemberService = staffMemberService;
    }

    /// <summary>
    /// Creates a new Staff Member.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<StaffMemberDto>> CreateStaffMember(CreateStaffMemberDto dto)
    {
        try
        {
            // The controller's ONLY job is to call the service.
            var resultDto = await _staffMemberService.CreateStaffMemberAsync(dto);

            // Return a 201 Created status with the location and the resource.
            return CreatedAtAction(nameof(GetStaffMemberById), new { id = resultDto.MecanographicNumber }, resultDto);
        }
        catch (ArgumentException ex)
        {
            // Catches validation errors from the domain and returns a 400 Bad Request.
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Retrieves a Staff Member by their Mecanographic Number.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<StaffMemberDto>> GetStaffMemberById(string id)
    {
        // TODO: This would also call a method on the service, e.g., _staffMemberService.GetByIdAsync(id)
        return NotFound($"Staff member with ID {id} not found.");
    }
}

