// Create new file: PortProject.Api/Controllers/AuthController.cs

using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Models;
using PortProject.Api.Domain.AppUserAggregate;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims; // Needed for User.Identity
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate; // <-- ADD THIS
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;

[ApiController]
[Route("api/auth")]
[Authorize] // IMPORTANT: User must be logged in with Firebase to call this
public class AuthController : ControllerBase
{
    private readonly PortProjectContext _context;
    private readonly IShippingAgentRepresentativeRepository _repRepository;

    public AuthController(PortProjectContext context, IShippingAgentRepresentativeRepository repRepository)
    {
        _context = context;
        _repRepository = repRepository;
    }

    [HttpGet("my-role")]
    public async Task<IActionResult> GetMyRole()
    {
        // Get the email from the validated Firebase token
        // 'Name' claim usually holds the email for Firebase tokens
        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");

        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new { message = "Email claim not found in token." });
        }

        var user = await _context.AppUsers.FindAsync(email.ToLowerInvariant());

        // AC: If the user has no assigned role (not in our table)
        if (user == null)
        {
            return Forbid(); // 403 Forbidden
        }

        // AC: By default, the users are set to a “deactivated” status
        if (user.Status == UserStatus.Deactivated)
        {
            return Forbid(); // 403 Forbidden
        }
        
        // If the user is a rep, find their Citizen ID
        string? citizenId = null;
        if (user.Role == Role.ShippingAgentRepresentative) {
            try { 
                var rep = await _repRepository.GetByEmailAsync(new RepresentativeEmail(email)); 
                if (rep != null) {
                                citizenId = rep.CitizenId.Value;
                }
            }
            catch (Exception)
            {
                // Could not create RepresentativeEmail (invalid format) or other error.
                // Log this, but proceed without a citizenId.
            }
        }

        // Success: User is found and activated
        return Ok(new { role = user.Role.ToString(), citizenId = citizenId });
    }
}