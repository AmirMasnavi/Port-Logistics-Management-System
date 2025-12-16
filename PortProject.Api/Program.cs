using Newtonsoft.Json.Converters;
using Microsoft.OpenApi.Models;
using PortProject.Api.Models;
using Microsoft.EntityFrameworkCore;
using PortProject.Api.Application.Dock.Services;
using PortProject.Api.Application.StaffMembers.Services;
using PortProject.Api.Application.StorageAreas.Services;
using PortProject.Api.Domain.QualificationAggregate;
using PortProject.Api.Domain.StaffMemberAggregate;
using PortProject.Api.Domain.StorageAggregate;
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Domain.VesselTypeAggregate;
using PortProject.Api.Infrastructure.Repositories;
using src.Infrastructure.VesselTypeAggregate;
using PortProject.Api.Services;
using src.Application.Services;
using src.Infrastructure.VesselAggregate;
using PortProject.Api.Application.Qualifications;
using PortProject.Api.Application.Qualifications.Services;
using PortProject.Api.Application.Resources.Services;
using PortProject.Api.Application.ShippingAgentsOrganization.Services;
using PortProject.Api.Application.ShippingAgentsRepresentative.Services;
using PortProject.Api.Application.VesselVisitNotification.Services;
using PortProject.Api.Domain.DockAggregate;
using PortProject.Api.Domain.ResourceAggregate;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using PortProject.Api.Application.PortLayout;
using Microsoft.IdentityModel.Tokens;
using PortProject.Api.Application.UserAdmin.Services;
using Microsoft.AspNetCore.Authentication;
using PortProject.Api.Infrastructure.Authentication;
using PortProject.Api.Infrastructure.Middleware;
using PortProject.Api.Application.PrivacyPolicy.Services;
using PortProject.Api.Domain.PrivacyPolicyAggregate;
using PortProject.Api.Application.DataRights.Services;
using PortProject.Api.Domain.DataRightsAggregate;


var builder = WebApplication.CreateBuilder(args);

var firebaseProjectId = "blueport-508e6";

Console.WriteLine("[STARTUP] Configuring authentication schemes...");

// Configure authentication with both JWT (for users) and API Key (for internal services)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // The "issuer" of Firebase tokens
        options.Authority = "https://securetoken.google.com/" + firebaseProjectId;

        // The "audience" is your project ID
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidAudience = firebaseProjectId,
            ValidIssuer = "https://securetoken.google.com/" + firebaseProjectId,
            ValidateLifetime = true
        };
        Console.WriteLine("[STARTUP] JWT Bearer authentication configured");
    })
    .AddScheme<ApiKeyAuthenticationOptions, ApiKeyAuthenticationHandler>("ApiKey", options => {
        Console.WriteLine("[STARTUP] API Key authentication scheme registered");
    });

Console.WriteLine("[STARTUP] Configuring authorization policies...");

// Configure authorization policies
builder.Services.AddAuthorization(options =>
{
    // Default policy requires JWT authentication
    options.DefaultPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme, "ApiKey")
        .Build();
    
    Console.WriteLine("[STARTUP] Authorization policy configured with schemes: JwtBearer, ApiKey");
});

// This registers the Claims Transformation Service
builder.Services.AddTransient<IClaimsTransformation, ClaimsTransformationService>();

// Add services to the container.
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        // preserve enum-as-string behavior
        options.SerializerSettings.Converters.Add(new StringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Port Project API",
        Version = "v1"
    });
});

var mysqlConn = builder.Configuration.GetConnectionString("DefaultConnection");
var serverVersion = ServerVersion.AutoDetect(mysqlConn);

builder.Services.AddDbContext<PortProjectContext>(options =>
    options.UseMySql(mysqlConn, serverVersion));
builder.Services.AddScoped<IStaffMemberService, StaffMemberService>();
builder.Services.AddScoped<IStaffMemberRepository, StaffMemberRepository>();
builder.Services.AddScoped<IVesselTypeRepository, VesselTypeRepository>();
builder.Services.AddScoped<IVesselTypeService, VesselTypeService>();
builder.Services.AddScoped<IVesselService, VesselService>();
builder.Services.AddScoped<IVesselRepository, VesselRepository>();
builder.Services.AddScoped<IStorageAreaRepository, StorageAreaRepository>();
builder.Services.AddScoped<IStorageAreaService, StorageAreaService>();
builder.Services.AddScoped<IQualificationRepository, QualificationRepository>();
builder.Services.AddScoped<IQualificationService, QualificationService>();
builder.Services.AddScoped<IShippingAgentOrganizationService, ShippingAgentOrganizationService>();
builder.Services.AddScoped<IShippingAgentRepresentativeService, ShippingAgentRepresentativeService>();
builder.Services.AddScoped<IShippingAgentOrganizationRepository, ShippingAgentOrganizationRepository>();
builder.Services.AddScoped<IShippingAgentRepresentativeRepository, ShippingAgentRepresentativeRepository>();
builder.Services.AddScoped<IVesselVisitNotificationService, VesselVisitNotificationService>();
builder.Services.AddScoped<IVesselVisitNotificationRepository, VesselVisitNotificationRepository>();
builder.Services.AddScoped<IDockRepository, DockRepository>();
builder.Services.AddScoped<IDockService, DockService>();
builder.Services.AddScoped<IResourceService, ResourceService>();
builder.Services.AddScoped<IResourceRepository, ResourceRepository>();
builder.Services.AddScoped<IPortLayoutService, PortLayoutService>();
builder.Services.AddScoped<IPrivacyPolicyService, PrivacyPolicyService>();
builder.Services.AddScoped<IPrivacyPolicyRepository, PrivacyPolicyRepository>();
builder.Services.AddScoped<IDataRightsService, DataRightsService>();
builder.Services.AddScoped<IDataRightsRequestRepository, DataRightsRequestRepository>();
builder.Services.AddTransient<IEmailService, EmailService>();


// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy => policy.WithOrigins(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5000",
            // Production frontend served from IIS on server IP
            "http://10.9.11.67"
        )
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

Console.WriteLine("[STARTUP] Configuring HTTP pipeline...");

app.UseCors("AllowFrontend");

// Add API Key Middleware BEFORE authentication
// This checks for X-API-Key header and sets HttpContext.User if valid
app.UseMiddleware<ApiKeyMiddleware>();
Console.WriteLine("[STARTUP] API Key Middleware registered");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Port Project API v1");
    });
    // In Development we have HTTPS endpoints from launchSettings
    app.UseHttpsRedirection();
}
// In Production do not force HTTPS redirection unless HTTPS endpoints/certs are configured.
else if (app.Environment.IsProduction())
{
    // Check if HTTPS redirection is needed based on configuration
    var redirectToHttps = builder.Configuration.GetValue<bool>("RedirectToHttps");
    if (redirectToHttps)
    {
        app.UseHttpsRedirection();
    }
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply database fixes on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<PortProjectContext>();
        Console.WriteLine("[STARTUP] Checking database schema...");
        
        // Add UserEmail column to UserPolicyAcknowledgments if it doesn't exist
        // Simply try to add it - if it exists, the error will be caught and ignored
        try
        {
            Console.WriteLine("[STARTUP] Attempting to add UserEmail column...");
            await context.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE UserPolicyAcknowledgments 
                ADD COLUMN UserEmail VARCHAR(255) NOT NULL DEFAULT '' AFTER UserId;
            ");
            Console.WriteLine("[STARTUP] ✅ UserEmail column added successfully");
        }
        catch (Exception ex)
        {
            // Column likely already exists - this is expected and OK
            if (ex.Message.Contains("Duplicate column name"))
            {
                Console.WriteLine("[STARTUP] UserEmail column already exists (this is OK)");
            }
            else
            {
                Console.WriteLine($"[STARTUP] Note: {ex.Message}");
            }
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while checking database schema.");
    }
}

app.Run();

// Expose the implicit Program type to allow integration tests to reference it
public partial class Program { }
