using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Models;
using PortProject.Api.Domain.AppUserAggregate;
using PortProject.Api.Application.UserAdmin.DTOs;
using System.Threading.Tasks;
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization; // We need this!

[ApiController]
[Route("api/admin")]
[Authorize] // 1. Only authenticated users can access this
public class UserAdminController : ControllerBase
{
    private readonly PortProjectContext _context;
    
    public UserAdminController(PortProjectContext context)
    {
        _context = context;
    }

    [HttpPost("assign-role")]
    // [Authorize(Roles = "Administrator")] // We will add this in the NEXT step
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleDto dto)
    {
        if (!Enum.TryParse<Role>(dto.Role, true, out var role))
            return BadRequest(new { message = "Invalid role specified." });

        var user = await _context.AppUsers.FindAsync(dto.Email.ToLowerInvariant());
        
        if (user != null)
        {
            // User exists, just update their role
            user.ChangeRole(role);
        }
        else
        {
            // User doesn't exist, create them
            user = new AppUser(dto.Email, role);
            await _context.AppUsers.AddAsync(user);
        }

        await _context.SaveChangesAsync();
        
        // 4. TODO: We would send the activation email here
        // We can skip the email logic for now.

        return Ok(new { 
            email = user.Email, 
            role = user.Role.ToString(), 
            status = user.Status.ToString(), 
            activationToken = user.ActivationToken 
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