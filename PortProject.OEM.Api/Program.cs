using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PortProject.OEM.Api.Application.Gateways;
using PortProject.OEM.Api.Infrastructure.Gateways;
using PortProject.OEM.Api.Infrastructure.Persistence;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// --- 1. CONFIGURATION ---
var firebaseProjectId = builder.Configuration["Firebase:ProjectId"] ?? "blueport-508e6";
var masterDataUrl = builder.Configuration["MasterDataApi:BaseUrl"] ?? "http://localhost:5273";
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

Console.WriteLine($"[OEM STARTUP] Connecting to Master Data at: {masterDataUrl}");

// --- 2. DATABASE ---
var serverVersion = ServerVersion.AutoDetect(connectionString);
builder.Services.AddDbContext<OemDbContext>(options =>
    options.UseMySql(connectionString, serverVersion));

// --- 3. AUTHENTICATION (Copied from Old Project) ---
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://securetoken.google.com/" + firebaseProjectId;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidAudience = firebaseProjectId,
            ValidIssuer = "https://securetoken.google.com/" + firebaseProjectId,
            ValidateLifetime = true
        };
    });

// --- 4. GATEWAY SERVICES (The Phone Line) ---
builder.Services.AddHttpClient<IMasterDataGateway, MasterDataGateway>(client =>
{
    client.BaseAddress = new Uri(masterDataUrl);
    // Optional: Add headers here if your old API requires an API Key
    // client.DefaultRequestHeaders.Add("X-API-Key", "YOUR_KEY"); 
});

// --- 5. CONTROLLERS & SWAGGER ---
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- 6. CORS (Allow Frontend) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy => policy.WithOrigins(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5000"
        )
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

// --- PIPELINE ---
app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();