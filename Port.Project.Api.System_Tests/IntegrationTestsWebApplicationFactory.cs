using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PortProject.Api.Models;
using PortProject.Api.Domain.VesselTypeAggregate;
using System.Linq;

namespace Port.Project.Api.System_Tests
{
    // Test WebApplicationFactory wrapper used by system tests
    public class IntegrationTestsWebApplicationFactory<TProgram> : WebApplicationFactory<TProgram> where TProgram : class
    {
        private SqliteConnection? _connection;

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

                    // Seed initial data for tests (vessel types)
                    if (!db.VesselTypes.Any())
                    {
                        db.VesselTypes.AddRange(new[] {
                            VesselType.Create("1001", "Container Ship", "Seeded container ship", 5000, 10, 20, 8),
                            VesselType.Create("1002", "Bulk Carrier", "Seeded bulk carrier", 8000, 12, 25, 10),
                            VesselType.Create("1003", "Tanker", "Seeded tanker", 3000, 8, 15, 6)
                        });
                        db.SaveChanges();
                    }
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
                catch (Exception /*ex*/)
                {
                    // Ignore disposal errors - nothing we can do in tests
                }
            }
        }
    }
}
