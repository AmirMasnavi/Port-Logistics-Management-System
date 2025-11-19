// File: `PortProject.Api/Controllers/AuthController.cs`
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PortProject.Api.Models;
using PortProject.Api.Domain.AppUserAggregate;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using System;

[ApiController]
[Route("api/auth")]
[Authorize]
public class AuthController : ControllerBase
{
    private readonly PortProjectContext _context;
    private readonly IShippingAgentRepresentativeRepository _repRepository;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        PortProjectContext context,
        IShippingAgentRepresentativeRepository repRepository,
        ILogger<AuthController> logger)
    {
        _context = context;
        _repRepository = repRepository;
        _logger = logger;
    }

    [HttpGet("my-role")]
    public async Task<IActionResult> GetMyRole()
    {
        string? email = null;

        try
        {
            email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");

            if (string.IsNullOrWhiteSpace(email))
            {
                return BadRequest(new { message = "Email claim not found in token." });
            }

            var normalizedEmail = email.ToLowerInvariant();

            // Usa FirstOrDefaultAsync para evitar dependência do key do FindAsync
            var user = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

            if (user == null)
            {
                return Forbid(); // 403
            }

            if (user.Status == UserStatus.Deactivated)
            {
                return Forbid(); // 403
            }

            string? citizenId = null;

            if (user.Role == Role.ShippingAgentRepresentative)
            {
                try
                {
                    var rep = await _repRepository.GetByEmailAsync(new RepresentativeEmail(email));
                    if (rep != null && rep.CitizenId != null)
                    {
                        citizenId = rep.CitizenId.Value;
                    }
                }
                catch (Exception ex)
                {
                    // Não falhar a request por problemas ao obter o rep; regista e prossegue sem citizenId
                    _logger.LogWarning(ex, "Falha ao obter ShippingAgentRepresentative para email {Email}", email);
                }
            }

            return Ok(new { role = user.Role.ToString(), citizenId });
        }
        catch (Exception ex)
        {
            // Regista e devolve 500 genérico para não expor detalhes internos
            _logger.LogError(ex, "Erro inesperado em GetMyRole para email {Email}", email ?? "(n/a)");
            return StatusCode(500, new { message = "Erro interno do servidor." });
        }
    }
}