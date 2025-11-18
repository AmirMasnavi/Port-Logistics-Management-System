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
    [Authorize(Roles = "Administrator")]
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
}