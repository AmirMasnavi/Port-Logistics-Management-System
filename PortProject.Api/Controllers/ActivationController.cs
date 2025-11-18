using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Models;
using PortProject.Api.Domain.AppUserAggregate;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization; // Need this for [Authorize]
using System.Security.Claims; // Need this to read the user's ID

namespace PortProject.Api.Controllers
{
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
        [Authorize] // 👈 CHANGED: User MUST be logged in now!
        public async Task<IActionResult> ActivateAccount([FromQuery] string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                return BadRequest(new { message = "Activation token is required." });
            }

            // 1. Find the account associated with this token
            var userToActivate = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.ActivationToken == token);

            if (userToActivate == null)
            {
                return BadRequest(new { message = "Invalid or expired activation token." });
            }

            // 2. Get the email of the person currently logged in (from Firebase Token)
            // ✅ ADDED: Debug logging to see all claims
            Console.WriteLine("=== ACTIVATION: Checking Claims ===");
            foreach (var claim in User.Claims)
            {
                Console.WriteLine($"Claim Type: {claim.Type}, Value: {claim.Value}");
            }
            
            var loggedInEmail = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");

            if (string.IsNullOrEmpty(loggedInEmail))
            {
                Console.WriteLine($"❌ ACTIVATION: Could not find email claim in token!");
                return Unauthorized(new { message = "Could not determine your email address. Please ensure you're logged in with a valid account." });
            }

            Console.WriteLine($"✅ ACTIVATION: Logged in as '{loggedInEmail}', attempting to activate '{userToActivate.Email}'");

            // 3. SECURITY CHECK: Do they match?
            // The person logged in MUST be the person we are trying to activate.
            if (!loggedInEmail.Equals(userToActivate.Email, StringComparison.OrdinalIgnoreCase))
            {
                Console.WriteLine($"❌ ACTIVATION: Identity mismatch!");
                return BadRequest(new { message = $"Identity mismatch. You are logged in as '{loggedInEmail}', but this activation link belongs to '{userToActivate.Email}'. Please log out and log in with the correct account." });
            }

            if (userToActivate.Status == UserStatus.Activated)
            {
                Console.WriteLine($"⚠️ ACTIVATION: Account already activated.");
                return BadRequest(new { message = "Account is already activated." });
            }

            // 4. Activate
            userToActivate.Activate();
            await _context.SaveChangesAsync();

            Console.WriteLine($"✅ ACTIVATION: Successfully activated account for '{loggedInEmail}'");
            return Ok(new { message = "Account activated successfully! You may now access the system." });
        }
    }
}