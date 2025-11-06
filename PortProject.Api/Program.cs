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
using PortProject.Api.Domain.VesselTypeAggregate;
using PortProject.Api.Infrastructure.Repositories;
using PortProject.Api.Services;
using src.Application.Services;
using src.Infrastructure.VesselAggregate;
using src.Infrastructure.VesselTypeAggregate;
using PortProject.Api.Application.Qualifications;
using PortProject.Api.Application.Qualifications.Services;
using PortProject.Api.Application.Resources.Services;
using PortProject.Api.Application.ShippingAgentsOrganization.Services;
using PortProject.Api.Application.ShippingAgentsRepresentative.Services;
using PortProject.Api.Application.VesselVisitNotification;
using PortProject.Api.Application.VesselVisitNotification.Services;
using PortProject.Api.Domain.DockAggregate;
using PortProject.Api.Domain.ResourceAggregate;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;


var builder = WebApplication.CreateBuilder(args);

var firebaseProjectId = "blueport-508e6";

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
    });

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

builder.Services.AddDbContext<PortProjectContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
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


// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy => policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

app.UseCors("AllowFrontend");
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Port Project API v1");
    });
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


app.Run();

// Expose the implicit Program type to allow integration tests to reference it
public partial class Program { }
