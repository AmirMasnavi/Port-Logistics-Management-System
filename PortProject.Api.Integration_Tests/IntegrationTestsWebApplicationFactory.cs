using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PortProject.Api.Models;
using PortProject.Api.Integration_Tests.Helpers;

namespace PortProject.Api.Integration_Tests;




public class IntegrationTestsWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
   
{
    private SqliteConnection _connection = null!;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Use Development environment for testsçt
        builder.UseEnvironment("Development");

        builder.ConfigureServices(services =>
        {
            // Remove existing DbContext registration if present
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<PortProjectContext>));
            if (descriptor != null)
                services.Remove(descriptor);

            // Create in-memory SQLite connection that stays open for the lifetime of the factory
            _connection = new SqliteConnection("DataSource=:memory:");
            _connection.Open();

            // Register DbContext using the in-memory SQLite
            services.AddDbContext<PortProjectContext>(options =>
            {
                options.UseSqlite(_connection);
            });

            // Build the provider and create the database schema
            var sp = services.BuildServiceProvider();
            using (var scope = sp.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
                db.Database.EnsureCreated();

                // Note: Seeding is done explicitly in each test to ensure clean state
                // and avoid tracking conflicts between tests
            }
        });

        base.ConfigureWebHost(builder);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        _connection?.Close();
        _connection?.Dispose();
    }
}