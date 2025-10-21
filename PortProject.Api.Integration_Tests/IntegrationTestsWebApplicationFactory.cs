using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PortProject.Api.Models;

namespace PortProject.Api.Integration_Tests;




public class IntegrationTestsWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
   
{
    private SqliteConnection _connection = null!;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Use Development environment for tests
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

                // Seed initial data for tests (if utility exists)
                try
                {
                    // VesselTypeUtilities.InitializeDbForTests may live in a helpers project; ignore if not present at compile time
                    var utilsType = System.Type.GetType("PortProject_IntegrationTests.Helpers.VesselTypeUtilities, PortProject_IntegrationTests");
                    if (utilsType != null)
                    {
                        var method = utilsType.GetMethod("InitializeDbForTests");
                        method?.Invoke(null, new object[] { db });
                    }
                }
                catch (System.Exception)
                {
                    // Ignore seeding errors here; tests can seed explicitly if needed
                }
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