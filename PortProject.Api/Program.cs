using System.Text.Json.Serialization;
using Microsoft.OpenApi.Models;
using PortProject.Api.Models;
using Microsoft.EntityFrameworkCore;
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


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // This converter tells the API to always use strings for enums
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
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

var app = builder.Build();

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
app.UseAuthorization();

app.MapControllers();


app.Run();