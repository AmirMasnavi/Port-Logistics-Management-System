using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PortProject.Api.Models;
using PortProject.Api.IntegrationTests.Helpers;

namespace PortProject_IntegrationTests
{
    // Test WebApplicationFactory wrapper used by integration tests
    public class IntegrationTestsWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
    {
        private SqliteConnection _connection = null!;

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");

            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext registration
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

                    // Seed initial data for tests
                    VesselTypeUtilities.InitializeDbForTests(db);
                }
            });

            base.ConfigureWebHost(builder);
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);

            if (_connection != null)
            {
                try
                {
                    _connection.Close();
                    _connection.Dispose();
                }
                catch { }
            }
        }
    }
}
