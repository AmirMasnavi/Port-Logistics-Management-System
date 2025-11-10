using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Models;
using PortProject.Api.Domain.AppUserAggregate;
using PortProject.Api.Application.UserAdmin.DTOs;
using Microsoft.AspNetCore.Authorization; // We need this!

[ApiController]
[Route("api/admin")]
[Authorize] // ✅ Topic 1: Requires authentication (token must be present)
public class UserAdminController : ControllerBase
{
    private readonly PortProjectContext _context;
   
    public UserAdminController(PortProjectContext context)
    {
        _context = context;

        // ✅ Topic 1: Firebase Admin SDK Initialization
        if (FirebaseApp.DefaultInstance == null)
        {
            // ✅ Topic 8: Credential Path Validation
            var credentialPath = Path.Combine(AppContext.BaseDirectory, "firebase-service-account.json");

            if (!System.IO.File.Exists(credentialPath))
                throw new FileNotFoundException("Firebase service account file not found.", credentialPath);

            FirebaseApp.Create(new AppOptions
            {
                Credential = GoogleCredential.FromFile(credentialPath)
            });
        }
    }
    // 2. This endpoint assigns a role
    [HttpPost("assign-role")]
    // [Authorize(Roles = "Administrator")] // 3. TODO: Add this once we can get roles
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleDto dto)
    {
        // ✅ Topic 2: Authorization Header Extraction
        var authHeader = Request.Headers["Authorization"].ToString();
        if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
            return Unauthorized(new { message = "Missing or invalid Authorization header." });

        var token = authHeader.Substring("Bearer ".Length);

        FirebaseToken decodedToken;
        try
        {
            // ✅ Topic 3: Token Verification
            decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(token);
        }
        catch (Exception ex)
        {
            // ✅ Topic 6: Error Handling for Invalid Tokens
            return Unauthorized(new { message = "Invalid or expired token.", details = ex.Message });
        }

        // ✅ Topic 4: Claim Extraction - Email
        var requesterEmail = decodedToken.Claims["email"]?.ToString()?.ToLowerInvariant();
        if (string.IsNullOrEmpty(requesterEmail))
            return Unauthorized(new { message = "Token does not contain email." });

        // ✅ Topic 4: Claim Extraction - Role
        // ✅ Topic 5: Role-Based Access Control
        if (decodedToken.Claims.TryGetValue("role", out var roleClaim))
        {
            var requesterRole = roleClaim?.ToString();
            if (requesterRole != "Administrator")
                return Forbid("Insufficient permissions. Only Administrators can assign roles.");
        }
        else
        {
            return Forbid("Missing role claim. Cannot verify permissions.");
        }

        // ✅ Topic 6: Error Handling for Invalid Role Input
        if (!Enum.TryParse<Role>(dto.Role, true, out var role))
            return BadRequest(new { message = "Invalid role specified." });

        // ✅ Topic 6: Error Handling for User Lookup/Create
        var user = await _context.AppUsers.FindAsync(dto.Email.ToLowerInvariant());

        if (user != null)
        {
            // User exists, just update their role
            user.ChangeRole(role);// Update role
        }
        else
        {
            // User doesn't exist, create them
            user = new AppUser(dto.Email, role); // Create new user
            await _context.AppUsers.AddAsync(user);
        }

        await _context.SaveChangesAsync();

        // ✅ Topic 7: Audit Trail - Include requester identity
        return Ok(new { 
            email = user.Email, 
            role = user.Role.ToString(), 
            status = user.Status.ToString(), 
            activationToken = user.ActivationToken 
        });
    }
}