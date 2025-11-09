using PortProject.Planning.Api.Application.Clients;
using PortProject.Planning.Api.Application.Services;

var builder = WebApplication.CreateBuilder(args);

// --- Register Controllers ---
builder.Services.AddControllers();

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
    // This is the URL of your *other* API, from its launchSettings.json [cite: 979]
    client.BaseAddress = new Uri("http://localhost:5273");
});

// 2. Register our new "dummy" Scheduling Service
builder.Services.AddScoped<ISchedulingService, SchedulingService>();


var app = builder.Build();

// --- Configure HTTP Pipeline ---
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