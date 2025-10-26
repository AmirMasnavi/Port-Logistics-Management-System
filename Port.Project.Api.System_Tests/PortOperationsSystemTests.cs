using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using PortProject.Api.Models;
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Domain.VesselTypeAggregate;
using PortProject.Api.Application.Dock.DTOs;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Application.VesselVisitNotification.DTOs;
using src.Dto;
using Xunit;

namespace Port.Project.Api.System_Tests
{
    public class PortOperationsSystemTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly IntegrationTestsWebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public PortOperationsSystemTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        }

        // helpers copied from existing tests for consistency
        private async Task<HttpResponseMessage> PostJsonAsync(string url, object obj)
        {
            var json = JsonConvert.SerializeObject(obj);
            Console.WriteLine($"[TEST DEBUG] POST {url} - RequestBody: {json}");
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var resp = await _client.PostAsync(url, content);
            var respBody = await resp.Content.ReadAsStringAsync();
            Console.WriteLine($"[TEST DEBUG] POST {url} - ResponseStatus: {(int)resp.StatusCode} {resp.StatusCode} - Body: {respBody}");
            return resp;
        }

        private async Task<T> PostAndReadJsonAsync<T>(string url, object obj)
        {
            var resp = await PostJsonAsync(url, obj);
            var body = await resp.Content.ReadAsStringAsync();
            if (!resp.IsSuccessStatusCode)
            {
                // Throw a detailed exception so the test runner output contains full debug info
                throw new Xunit.Sdk.XunitException($"POST {url} failed: {(int)resp.StatusCode} {resp.StatusCode}\nResponse Body:\n{body}");
            }
            return JsonConvert.DeserializeObject<T>(body)!;
        }

        private async Task<T> GetAndReadJsonAsync<T>(string url)
        {
            Console.WriteLine($"[TEST DEBUG] GET {url}");
            var resp = await _client.GetAsync(url);
            var body = await resp.Content.ReadAsStringAsync();
            Console.WriteLine($"[TEST DEBUG] GET {url} - ResponseStatus: {(int)resp.StatusCode} {resp.StatusCode} - Body: {body}");
            if (!resp.IsSuccessStatusCode)
            {
                throw new Xunit.Sdk.XunitException($"GET {url} failed: {(int)resp.StatusCode} {resp.StatusCode}\nResponse Body:\n{body}");
            }
            return JsonConvert.DeserializeObject<T>(body)!;
        }

        private void ReinitializeDb(Action<PortProjectContext>? beforeSave = null)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            
            // Remove entities in correct order to respect foreign key constraints
            if (db.VesselVisitNotifications.Any()) db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            if (db.Vessels.Any()) db.Vessels.RemoveRange(db.Vessels);
            if (db.ShippingAgentRepresentatives.Any()) db.ShippingAgentRepresentatives.RemoveRange(db.ShippingAgentRepresentatives);
            if (db.ShippingAgentOrganizations.Any()) db.ShippingAgentOrganizations.RemoveRange(db.ShippingAgentOrganizations);
            if (db.Docks.Any()) db.Docks.RemoveRange(db.Docks);
            if (db.VesselTypes.Any()) db.VesselTypes.RemoveRange(db.VesselTypes);
            db.SaveChanges();

            // seed minimal vessel types
            db.VesselTypes.AddRange(new[] {
                VesselType.Create("1001", "Container Ship", "Seeded container ship", 5000, 10, 20, 8),
                VesselType.Create("1002", "Bulk Carrier", "Seeded bulk carrier", 8000, 12, 25, 10),
            });

            beforeSave?.Invoke(db);
            db.SaveChanges();
        }

        // Simple helper to generate a valid IMO (7 digits with check digit)
        private static string GenerateValidImo(int sixDigitSeed)
        {
            var core = sixDigitSeed.ToString().PadLeft(6, '0');
            int sum = 0;
            for (int i = 0; i < 6; i++)
            {
                int digit = core[i] - '0';
                sum += digit * (7 - i);
            }
            int check = sum % 10;
            return core + check.ToString();
        }

        [Fact(DisplayName = "System: Complete Port Operation Workflow")]
        public async Task CompletePortOperationWorkflow_CreateAllEntitiesAndVesselVisit_ShouldSucceed()
        {
            // Arrange
            ReinitializeDb();

            // 1) Create Vessel Type
            var vesselTypeCreate = new VesselTypeCreateDto
            {
                Id = "2001",
                Name = "Test ULCV",
                Description = "Created by system test",
                Capacity = 10000,
                MaxBays = 20,
                MaxRows = 16,
                MaxTiers = 12
            };

            var vt = await PostAndReadJsonAsync<VesselTypeDto>("/api/VesselType", vesselTypeCreate);
            Assert.NotNull(vt);
            Assert.Equal("2001", vt.Id);

            // 2) Create Vessel
            var imo = GenerateValidImo(new Random().Next(100000, 999999));
            var vesselCreate = new VesselCreateDto
            {
                ImoNumber = imo,
                Name = "MV SystemTest",
                VesselTypeId = vt.Id,
                Operator = "TestOperator"
            };

            var vessel = await PostAndReadJsonAsync<VesselDto>("/api/Vessel", vesselCreate);
            Assert.NotNull(vessel);
            Assert.Equal(imo, vessel.ImoNumber);

            // 3) Create Dock
            var dockCreate = new DockCreateDto
            {
                Id = "DCK-ST-001",
                Name = "Operations Test Dock",
                LocationZone = "North Terminal",
                LocationSection = "A",
                LengthInMeters = 600,
                DepthInMeters = 30,
                MaxDraftInMeters = 20,
                NumberOfSTSCranes = 4,
                AllowedVesselTypeIds = new List<string> { vt.Id }
            };

            var dock = await PostAndReadJsonAsync<DockDto>("/api/Dock", dockCreate);
            Assert.NotNull(dock);
            Assert.Equal("Operations Test Dock", dock.Name);

            // 4) Create Organization with Representative included (required by business rules)
            var orgCreate = new CreateShippingAgentOrganizationDto
            {
                LegalName = "System Test Org",
                AlternativeName = "STO",
                Street = "Test Street 1",
                City = "Test City",
                Country = "TestLand",
                TaxNumber = "PT123456789", // Valid Portuguese NIF format
                Representatives = new List<CreateShippingAgentRepresentativeDto>
                {
                    new CreateShippingAgentRepresentativeDto
                    {
                        RepresentativeName = "Operations Representative",
                        CitizenId = "12345678Z", // Valid Portuguese CC format (8 digits + 1 letter)
                        RepresentativeNationality = "Portuguese",
                        RepresentativeEmail = "ops.rep@systemtest.com",
                        RepresentativePhone = "912345678" // Valid Portuguese mobile format
                    }
                }
            };

            var orgId = await PostAndReadJsonAsync<Guid>("/api/ShippingAgentOrganizations", orgCreate);
            Assert.NotEqual(Guid.Empty, orgId);

            // 5) Get the created representative ID from the database
            string repId;
            using (var scope1 = _factory.Services.CreateScope())
            {
                var db1 = scope1.ServiceProvider.GetRequiredService<PortProjectContext>();
                var representatives = await db1.ShippingAgentRepresentatives.ToListAsync();
                var representative = representatives.FirstOrDefault(r => r.OrganizationId.Value == orgId);
                Assert.NotNull(representative);
                repId = representative.RepresentativeId.Value.ToString();
            }

            // 6) Create Vessel Visit Notification with valid container code
            var createCargo = new CreateCargoDto
            {
                Description = "Test cargo for system test",
                Weight = 5000.0,
                Containers = new List<CreateContainerDto>
                {
                    new CreateContainerDto { ContainerCode = "CSQU3054383", Position = "Bay1-Row1-Tier1" } // Valid ISO 6346 container code
                }
            };

            var createVvn = new CreateVvnDto
            {
                EstimatedArrival = DateTime.UtcNow.AddDays(2),
                EstimatedDeparture = DateTime.UtcNow.AddDays(4),
                VesselImo = imo,
                Cargo = createCargo,
                RepresentativeId = repId,
                CrewMembers = new List<CreateCrewMemberDto>
                {
                    new CreateCrewMemberDto { Name = "Captain Test", Nationality = "PT", IsSafetyOfficer = true },
                    new CreateCrewMemberDto { Name = "First Officer", Nationality = "PT", IsSafetyOfficer = false }
                }
            };

            var vvn = await PostAndReadJsonAsync<VesselVisitNotificationDto>("/api/notifications", createVvn);
            Assert.NotNull(vvn);
            Assert.Equal(imo, vvn.VesselImo);
            Assert.Equal(Guid.Parse(repId), vvn.SubmittedBy);
            Assert.NotNull(vvn.Cargo);
            Assert.NotEmpty(vvn.CrewMembers);
            Assert.Equal(2, vvn.CrewMembers.Count);

            // Verify persisted in DB with all relationships intact
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            
            var dbVvn = await db.VesselVisitNotifications
                .Include(v => v.Cargo)
                .FirstOrDefaultAsync();
            Assert.NotNull(dbVvn);
            Assert.Equal(imo, dbVvn.VesselId.Value);
            
            var vessels = await db.Vessels.ToListAsync();
            var dbVessel = vessels.FirstOrDefault(v => v.ImoNumber.Value == imo);
            Assert.NotNull(dbVessel);
            
            var dbDock = await db.Docks.FirstOrDefaultAsync();
            Assert.NotNull(dbDock);
            Assert.Contains(dbDock.AllowedVesselTypes, vesselTypeId => vesselTypeId.Value == vt.Id);
        }
    }
}
