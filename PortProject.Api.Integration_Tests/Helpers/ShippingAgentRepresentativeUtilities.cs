using PortProject.Api.Models;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;

namespace PortProject.Api.Integration_Tests.Helpers
{
    /// <summary>
    /// Utility class to initialize and manage test data for ShippingAgentRepresentative.
    /// </summary>
    public static class ShippingAgentRepresentativeUtilities
    {
        /// <summary>
        /// Initializes the database with seed data for tests.
        /// </summary>
        /// <param name="db">Database context</param>
        public static void InitializeDbForTests(PortProjectContext db)
        {
            // First ensure we have organizations
            ShippingAgentOrganizationUtilities.InitializeDbForTests(db);
            
            // Then add representatives
            db.ShippingAgentRepresentatives.AddRange(GetSeedingShippingAgentRepresentativesData());
            db.SaveChanges();
        }

        /// <summary>
        /// Reinitializes the database, removing all existing ShippingAgentRepresentatives
        /// and adding seed data again.
        /// </summary>
        /// <param name="db">Database context</param>
        public static void ReinitializeDbForTests(PortProjectContext db)
        {
            // Use Database.EnsureDeleted and EnsureCreated for a clean slate
            db.Database.EnsureDeleted();
            db.Database.EnsureCreated();
            
            // Clear the change tracker
            db.ChangeTracker.Clear();
            
            // Add organizations first
            db.ShippingAgentOrganizations.AddRange(ShippingAgentOrganizationUtilities.GetSeedingShippingAgentOrganizationsData());
            db.SaveChanges();
            
            // Add representatives
            db.ShippingAgentRepresentatives.AddRange(GetSeedingShippingAgentRepresentativesData());
            db.SaveChanges();
            
            // Final clear
            db.ChangeTracker.Clear();
        }

        /// <summary>
        /// Returns a list of ShippingAgentRepresentatives for database seeding.
        /// Contains pre-configured representatives for tests.
        /// </summary>
        /// <returns>List of ShippingAgentRepresentative for tests</returns>
        public static List<ShippingAgentRepresentative> GetSeedingShippingAgentRepresentativesData()
        {
            var org1Id = new OrganizationId(Guid.Parse("11111111-1111-1111-1111-111111111111"));
            var org2Id = new OrganizationId(Guid.Parse("22222222-2222-2222-2222-222222222222"));
            
            var representatives = new List<ShippingAgentRepresentative>
            {
                new ShippingAgentRepresentative(
                    new CitizenId("12345678"),
                    new RepresentativeName("Maria Silva"),
                    new RepresentativePhone("912345678"),
                    new RepresentativeNationality("Portuguese"),
                    new RepresentativeEmail("maria.silva@maersk.pt")
                ),
                new ShippingAgentRepresentative(
                    new CitizenId("87654321"),
                    new RepresentativeName("João Santos"),
                    new RepresentativePhone("923456789"),
                    new RepresentativeNationality("Portuguese"),
                    new RepresentativeEmail("joao.santos@maersk.pt")
                ),
                new ShippingAgentRepresentative(
                    new CitizenId("11223344"),
                    new RepresentativeName("Ana Costa"),
                    new RepresentativePhone("934567890"),
                    new RepresentativeNationality("Portuguese"),
                    new RepresentativeEmail("ana.costa@msc.pt")
                )
            };
            
            // Attach representatives to organizations
            representatives[0].AttachToOrganization(org1Id);
            representatives[1].AttachToOrganization(org1Id);
            representatives[2].AttachToOrganization(org2Id);
            
            return representatives;
        }
    }
}

