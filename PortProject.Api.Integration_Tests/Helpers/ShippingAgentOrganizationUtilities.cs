using PortProject.Api.Models;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using System.Collections.Generic;
using System.Linq;

namespace PortProject.Api.Integration_Tests.Helpers
{
    /// <summary>
    /// Utility class to initialize and manage test data for ShippingAgentOrganization.
    /// </summary>
    public static class ShippingAgentOrganizationUtilities
    {
        /// <summary>
        /// Initializes the database with seed data for tests.
        /// </summary>
        /// <param name="db">Database context</param>
        public static void InitializeDbForTests(PortProjectContext db)
        {
            db.ShippingAgentOrganizations.AddRange(GetSeedingShippingAgentOrganizationsData());
            db.SaveChanges();
        }

        /// <summary>
        /// Reinitializes the database, removing all existing ShippingAgentOrganizations
        /// and adding seed data again.
        /// </summary>
        /// <param name="db">Database context</param>
        public static void ReinitializeDbForTests(PortProjectContext db)
        {
            // Remove dependent entities first to avoid FK constraint failures
            try
            {
                db.ShippingAgentRepresentatives.RemoveRange(db.ShippingAgentRepresentatives);
                db.SaveChanges();
            }
            catch
            {
                // If there are no representatives or removal fails for another reason, continue
            }

            // Now remove organizations and re-seed
            db.ShippingAgentOrganizations.RemoveRange(db.ShippingAgentOrganizations);
            db.SaveChanges();
            
            // Clear the change tracker to avoid tracking conflicts
            db.ChangeTracker.Clear();
            
            InitializeDbForTests(db);
        }

        /// <summary>
        /// Returns a list of ShippingAgentOrganizations for database seeding.
        /// Contains 3+ pre-configured organizations for tests.
        /// </summary>
        /// <returns>List of ShippingAgentOrganization for tests</returns>
        public static List<ShippingAgentOrganization> GetSeedingShippingAgentOrganizationsData()
        {
            return new List<ShippingAgentOrganization>()
            {
                new ShippingAgentOrganization(
                    id: new OrganizationId(Guid.Parse("11111111-1111-1111-1111-111111111111")),
                    legalName: new LegalName("Maersk Line Portugal"),
                    alternativeName: new AlternativeName("Maersk PT"),
                    address: new Address("Rua do Comercio 123", "Lisbon", "Portugal"),
                    taxNumber: new TaxNumber("123456789")
                ),
                new ShippingAgentOrganization(
                    id: new OrganizationId(Guid.Parse("22222222-2222-2222-2222-222222222222")),
                    legalName: new LegalName("Mediterranean Shipping Company"),
                    alternativeName: new AlternativeName("MSC Portugal"),
                    address: new Address("Avenida da Liberdade 456", "Porto", "Portugal"),
                    taxNumber: new TaxNumber("987654321")
                ),
                new ShippingAgentOrganization(
                    id: new OrganizationId(Guid.Parse("33333333-3333-3333-3333-333333333333")),
                    legalName: new LegalName("CMA CGM Iberia"),
                    alternativeName: new AlternativeName("CMA CGM"),
                    address: new Address("Rua das Naus 789", "Setubal", "Portugal"),
                    taxNumber: new TaxNumber("555666777")
                )
            };
        }

        /// <summary>
        /// Returns minimal data to create a valid ShippingAgentOrganization in tests.
        /// Useful for tests that need a simple organization.
        /// </summary>
        /// <returns>ShippingAgentOrganization with minimal configuration</returns>
        public static ShippingAgentOrganization GetMinimalShippingAgentOrganization()
        {
            return new ShippingAgentOrganization(
                id: OrganizationId.NewId(),
                legalName: new LegalName("Test Organization"),
                alternativeName: new AlternativeName("Test Org"),
                address: new Address("Test Street", "Test City", "Test Country"),
                taxNumber: new TaxNumber("111222333")
            );
        }
    }
}

