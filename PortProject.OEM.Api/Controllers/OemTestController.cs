using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortProject.OEM.Api.Application.Gateways;
using PortProject.OEM.Api.Infrastructure.Persistence;

namespace PortProject.OEM.Api.Controllers;

[ApiController]
[Route("api/oem")]
public class OemTestController : ControllerBase
{
    private readonly IMasterDataGateway _gateway;
    private readonly OemDbContext _dbContext; // Field definition

    // 👇 THIS CONSTRUCTOR IS CRITICAL 👇
    public OemTestController(IMasterDataGateway gateway, OemDbContext dbContext)
    {
        _gateway = gateway;
        _dbContext = dbContext; // This line was likely missing or the parameter wasn't there!
    }

    // 1. Public Endpoint (Test if server is alive)
    [HttpGet("ping")]
    [AllowAnonymous]
    public IActionResult Ping()
    {
        return Ok(new { message = "OEM Kitchen is Open!", time = DateTime.UtcNow });
    }

    // 2. Secure Endpoint (Test if Firebase Auth works)
    [HttpGet("secure")]
    [Authorize]
    public IActionResult CheckSecurity()
    {
        // We check specific claims to identify the user
        var userEmail = User.FindFirst("email")?.Value 
                        ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                        ?? "Unknown";
                        
        return Ok(new { message = $"Secure access granted for: {userEmail}" });
    }

    // 3. Gateway Endpoint (Test communication with Old Backend)
    [HttpGet("check-vvn/{id}")]
    public async Task<IActionResult> CheckVvn(string id)
    {
        var vvn = await _gateway.GetVvnAsync(id);
        
        if (vvn == null)
            return NotFound($"Could not find VVN '{id}' in the Master Data system.");

        return Ok(new 
        { 
            message = "Communication Successful!", 
            dataFromOldBackend = vvn 
        });
    }

    // 4. Database Connection Test
    [HttpGet("check-db")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckDatabase()
    {
        try
        {
            Console.WriteLine("[DB TEST] Attempting to connect...");
            
            // This tries to open a connection without running a query
            bool canConnect = await _dbContext.Database.CanConnectAsync();
            
            if (canConnect)
            {
                return Ok(new 
                { 
                    status = "Success", 
                    message = "✅ Connected to portsystem_oem!" 
                });
            }
            else
            {
                return StatusCode(500, new 
                { 
                    status = "Failed", 
                    message = "❌ CanConnectAsync returned false. Check firewall/VPN or connection string." 
                });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new 
            { 
                status = "Error", 
                message = $"❌ Exception: {ex.Message}",
                details = ex.InnerException?.Message
            });
        }
    }
}