using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace PortProject.Api.Infrastructure.Authentication;

/// <summary>
/// API Key authentication handler for service-to-service communication.
/// This allows internal services (like Planning API) to authenticate without Firebase tokens.
/// </summary>
public class ApiKeyAuthenticationHandler : AuthenticationHandler<ApiKeyAuthenticationOptions>
{
    private const string ApiKeyHeaderName = "X-API-Key";
    private readonly IConfiguration _configuration;

    public ApiKeyAuthenticationHandler(
        IOptionsMonitor<ApiKeyAuthenticationOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IConfiguration configuration)
        : base(options, logger, encoder)
    {
        _configuration = configuration;
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        Logger.LogInformation("[API KEY AUTH] Authentication attempt started for {Path}", Request.Path);
        
        // Check if the API Key header is present
        if (!Request.Headers.TryGetValue(ApiKeyHeaderName, out var apiKeyHeaderValues))
        {
            Logger.LogWarning("[API KEY AUTH] No X-API-Key header found");
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var providedApiKey = apiKeyHeaderValues.FirstOrDefault();

        if (string.IsNullOrWhiteSpace(providedApiKey))
        {
            Logger.LogWarning("[API KEY AUTH] X-API-Key header is empty");
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        Logger.LogInformation("[API KEY AUTH] X-API-Key header found: {Key}", 
            providedApiKey.Substring(0, Math.Min(20, providedApiKey.Length)) + "...");

        // Get the expected API key from configuration
        var expectedApiKey = _configuration["ApiKey:InternalServices"];

        if (string.IsNullOrWhiteSpace(expectedApiKey))
        {
            Logger.LogError("[API KEY AUTH] API Key for internal services is NOT CONFIGURED in appsettings.json!");
            return Task.FromResult(AuthenticateResult.Fail("API Key not configured"));
        }

        Logger.LogInformation("[API KEY AUTH] Expected API key loaded from config: {Key}",
            expectedApiKey.Substring(0, Math.Min(20, expectedApiKey.Length)) + "...");

        // Validate the API key
        if (providedApiKey != expectedApiKey)
        {
            Logger.LogWarning("[API KEY AUTH] API Key MISMATCH! Provided key does not match expected key.");
            return Task.FromResult(AuthenticateResult.Fail("Invalid API Key"));
        }

        Logger.LogInformation("[API KEY AUTH] API Key validated successfully!");

        // Create claims for the authenticated service
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "InternalService"),
            new Claim(ClaimTypes.Role, "InternalService"),
            new Claim(ClaimTypes.Role, "Administrator"), // Add Administrator role for access to protected endpoints
            new Claim(ClaimTypes.Role, "PortAuthorityOfficer"), // Add PortAuthorityOfficer role
            new Claim(ClaimTypes.Role, "LogisticsOperator"), // Add LogisticsOperator role
            new Claim("service", "PlanningAPI")
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        Logger.LogInformation("[API KEY AUTH] Authentication SUCCESS! Created principal with roles: Administrator, PortAuthorityOfficer, LogisticsOperator");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

/// <summary>
/// Options for API Key authentication.
/// </summary>
public class ApiKeyAuthenticationOptions : AuthenticationSchemeOptions
{
}

