using PortProject.Planning.Api.Application.Clients;
using PortProject.Planning.Api.Application.Services;

var builder = WebApplication.CreateBuilder(args);

// --- Register CORS ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174") // Allow frontend origins
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// --- Register Controllers ---
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Use camelCase for JSON property names (e.g., scheduledTasks instead of ScheduledTasks)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// --- Register Swagger for API Documentation (AC 5) ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "PortProject Planning API", Version = "v1" });
});

// --- Register Our Services ---
// 1. Register the HttpClientFactory to call the main API
builder.Services.AddHttpClient<IPortApiHttpClient, PortApiHttpClient>(client =>
{
     // Configuração de Timeout para Benchmarking
    // This is the URL of your *other* API, from its launchSettings.json
    client.BaseAddress = new Uri("http://localhost:5273");
    
    // Add API Key header for authentication with the main API
    var apiKey = builder.Configuration["ApiKey:InternalServices"] 
                 ?? "PORT_INTERNAL_API_KEY_2025_SECURE_CHANGE_IN_PRODUCTION";
    client.DefaultRequestHeaders.Add("X-API-Key", apiKey);
});

// 1.b Register a named HttpClient for the Prolog server used by SchedulingService
builder.Services.AddHttpClient("PrologApiClient", client =>
{
    client.BaseAddress = new Uri("http://localhost:5001");
});

// 2. Register our new "dummy" Scheduling Service
builder.Services.AddScoped<ISchedulingService, SchedulingService>();


var app = builder.Build();

// --- Configure HTTP Pipeline ---

// Enable CORS (must be before other middleware)
app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    // Use Swagger UI
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Planning API v1");
    });
}

// Enable routing for controllers
app.MapControllers();

app.Run();