using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Models;
using PortProject.Api.Domain.AppUserAggregate;
using PortProject.Api.Application.UserAdmin.DTOs;
using System.Threading.Tasks;
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using PortProject.Api.Services; // We need this!

[ApiController]
[Route("api/admin")]
[Authorize] // 1. Only authenticated users can access this
public class UserAdminController : ControllerBase
{
    private readonly PortProjectContext _context;
    private readonly IEmailService _emailService;
    
    public UserAdminController(PortProjectContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }
    [HttpPost("assign-role")]
    [Authorize(Roles = "Administrator")] 
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleDto dto)
    {
        if (!Enum.TryParse<Role>(dto.Role, true, out var role))
            return BadRequest(new { message = "Invalid role specified." });

        var user = await _context.AppUsers.FindAsync(dto.Email.ToLowerInvariant());
        bool isNewUser = false;

        if (user != null)
        {
            user.ChangeRole(role);
            // If user was deactivated, we might want to reactivate or send a new token
            // For now, we assume we only send emails to NEW users or if explicitly requested.
        }
        else
        {
            isNewUser = true;
            user = new AppUser(dto.Email, role);
            await _context.AppUsers.AddAsync(user);
        }

        await _context.SaveChangesAsync();

        // 3. Send the Email!
        if (isNewUser && !string.IsNullOrEmpty(user.ActivationToken))
        {
            // Construct the link to your Frontend
            // NOTE: Ensure this port matches your React App (5173 or 5174)
            string frontendUrl = "http://localhost:5173"; 
            string link = $"{frontendUrl}/activate?token={user.ActivationToken}";

            // Call the service (Fire and forget, or await)
            await _emailService.SendActivationEmailAsync(user.Email, link);
        }

        return Ok(new { 
            email = user.Email, 
            role = user.Role.ToString(), 
            status = user.Status.ToString(),
            // You can remove activationToken from here now, since it's sent via email!
            message = "User invited and email sent."
        });
    }

    [HttpGet("stats")]
    // [Authorize(Roles = "Administrator")] // Can be added for extra security
    public async Task<IActionResult> GetAdminStats()
    {
        try
        {
            // Get total user count
            var totalUsers = await _context.AppUsers.CountAsync();
            
            // Get active users count (users with status Activated)
            var activeUsers = await _context.AppUsers
                .CountAsync(u => u.Status == UserStatus.Activated);
            
            // Get deactivated users (users with status Deactivated)
            var deactivatedUsers = await _context.AppUsers
                .CountAsync(u => u.Status == UserStatus.Deactivated);
            
            // Get total staff members
            var totalStaffMembers = await _context.StaffMembers.CountAsync();
            
            // Get total shipping agent organizations
            var totalOrganizations = await _context.ShippingAgentOrganizations.CountAsync();
            
            return Ok(new
            {
                totalUsers,
                activeUsers,
                deactivatedUsers,
                totalStaffMembers,
                totalOrganizations
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to retrieve admin statistics", error = ex.Message });
        }
    }
}