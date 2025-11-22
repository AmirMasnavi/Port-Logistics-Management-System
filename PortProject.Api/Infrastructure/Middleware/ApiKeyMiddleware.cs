using System.Security.Claims;

namespace PortProject.Api.Infrastructure.Middleware;

/// <summary>
/// Middleware to handle API Key authentication for internal service-to-service communication.
/// This runs before the authentication middleware and injects authentication when a valid API Key is present.
/// </summary>
public class ApiKeyMiddleware
{
    private const string ApiKeyHeaderName = "X-API-Key";
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiKeyMiddleware> _logger;
    private readonly string? _expectedApiKey;

    public ApiKeyMiddleware(RequestDelegate next, IConfiguration configuration, ILogger<ApiKeyMiddleware> logger)
    {
        _next = next;
        _logger = logger;
        _expectedApiKey = configuration["ApiKey:InternalServices"];
        
        if (string.IsNullOrWhiteSpace(_expectedApiKey))
        {
            _logger.LogWarning("[API KEY MIDDLEWARE] API Key not configured in appsettings.json!");
        }
        else
        {
            _logger.LogInformation("[API KEY MIDDLEWARE] Initialized with API Key from configuration");
        }
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Check if API Key header is present
        if (context.Request.Headers.TryGetValue(ApiKeyHeaderName, out var apiKeyValue))
        {
            var providedKey = apiKeyValue.FirstOrDefault();
            
            _logger.LogInformation("[API KEY MIDDLEWARE] X-API-Key header detected for {Path}", context.Request.Path);

            if (!string.IsNullOrWhiteSpace(providedKey) && 
                !string.IsNullOrWhiteSpace(_expectedApiKey) && 
                providedKey == _expectedApiKey)
            {
                _logger.LogInformation("[API KEY MIDDLEWARE] Valid API Key - Creating authenticated principal");

                // Create an authenticated user with the necessary roles
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, "InternalService"),
                    new Claim(ClaimTypes.NameIdentifier, "InternalService"),
                    new Claim(ClaimTypes.Role, "Administrator"),
                    new Claim(ClaimTypes.Role, "PortAuthorityOfficer"),
                    new Claim(ClaimTypes.Role, "LogisticsOperator"),
                    new Claim("AuthenticationType", "ApiKey")
                };

                var identity = new ClaimsIdentity(claims, "ApiKey");
                var principal = new ClaimsPrincipal(identity);
                
                // Set the user on the HttpContext
                context.User = principal;
                
                _logger.LogInformation("[API KEY MIDDLEWARE] Authentication SUCCESS - User set with roles: Administrator, PortAuthorityOfficer, LogisticsOperator");
            }
            else
            {
                _logger.LogWarning("[API KEY MIDDLEWARE] Invalid API Key provided");
            }
        }

        await _next(context);
    }
}

