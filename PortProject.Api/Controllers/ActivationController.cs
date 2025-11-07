// Create new file: PortProject.Api/Controllers/ActivationController.cs

using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Models;
using PortProject.Api.Domain.AppUserAggregate; // For UserStatus
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization; // For [AllowAnonymous]

[ApiController]
[Route("api/auth")]
public class ActivationController : ControllerBase
{
    private readonly PortProjectContext _context;

    public ActivationController(PortProjectContext context)
    {
        _context = context;
    }

    [HttpGet("activate")]
    [AllowAnonymous] // This endpoint MUST allow anonymous users
    public async Task<IActionResult> ActivateAccount([FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(new { message = "Activation token is required." });
        }

        // Find the user by their unique activation token
        var user = await _context.AppUsers
            .FirstOrDefaultAsync(u => u.ActivationToken == token);

        if (user == null)
        {
            return BadRequest(new { message = "Invalid or expired activation token." });
        }

        if (user.Status == UserStatus.Activated)
        {
            return BadRequest(new { message = "Account is already activated." });
        }

        // Use the domain method to activate
        user.Activate();

        await _context.SaveChangesAsync();

        return Ok(new { message = "Account activated successfully! You may now log in." });
    }
}