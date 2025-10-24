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
            if (db.Vessels.Any()) db.Vessels.RemoveRange(db.Vessels);
            if (db.VesselTypes.Any()) db.VesselTypes.RemoveRange(db.VesselTypes);
            if (db.VesselVisitNotifications.Any()) db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            if (db.ShippingAgentRepresentatives.Any()) db.ShippingAgentRepresentatives.RemoveRange(db.ShippingAgentRepresentatives);
            if (db.ShippingAgentOrganizations.Any()) db.ShippingAgentOrganizations.RemoveRange(db.ShippingAgentOrganizations);
            if (db.Docks.Any()) db.Docks.RemoveRange(db.Docks);
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

            // 4) Create Organization
            var orgCreate = new CreateShippingAgentOrganizationDto
            {
                LegalName = "System Test Org",
                AlternativeName = "STO",
                Street = "Test Street 1",
                City = "Test City",
                Country = "TestLand",
                TaxNumber = "351111222"
            };

            var orgId = await PostAndReadJsonAsync<Guid>("/api/ShippingAgentOrganizations", orgCreate);
            Assert.NotEqual(Guid.Empty, orgId);

            // 5) Create Representative (requires OrganizationId)
            var repCreate = new CreateShippingAgentRepresentativeDto
            {
                RepresentativeName = "Operations Rep",
                CitizenId = "123456789",
                RepresentativeNationality = "Portuguese",
                RepresentativeEmail = "ops@example.com",
                RepresentativePhone = "+351912345678",
                OrganizationId = orgId.ToString()
            };

            var rep = await PostAndReadJsonAsync<PortProject.Api.Application.ShippingAgentsOrganization.DTOs.ShippingAgentRepresentativeDto>("/api/ShippingAgentRepresentatives", repCreate);
            Assert.NotNull(rep);

            // 6) Create Vessel Visit Notification
            var createCargo = new CreateCargoDto
            {
                Description = "Test cargo",
                Weight = 5000.0,
                Containers = new List<CreateContainerDto>
                {
                    new CreateContainerDto { ContainerCode = "TEST1234567", Position = "Bay1-Row1-Tier1" }
                }
            };

            var createVvn = new CreateVvnDto
            {
                EstimatedArrival = DateTime.UtcNow.AddDays(2),
                EstimatedDeparture = DateTime.UtcNow.AddDays(4),
                VesselImo = imo,
                Cargo = createCargo,
                RepresentativeId = rep.RepresentativeId,
                CrewMembers = new List<CreateCrewMemberDto>
                {
                    new CreateCrewMemberDto { Name = "Captain Test", Nationality = "PT", IsSafetyOfficer = true }
                }
            };

            var vvn = await PostAndReadJsonAsync<VesselVisitNotificationDto>("/api/notifications", createVvn);
            Assert.NotNull(vvn);
            Assert.Equal(imo, vvn.VesselImo);
            Assert.Equal(Guid.Parse(rep.RepresentativeId), vvn.SubmittedBy);

            // Verify persisted in DB
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            var dbVvn = await db.VesselVisitNotifications.FirstOrDefaultAsync();
            Assert.NotNull(dbVvn);
        }
    }
}
