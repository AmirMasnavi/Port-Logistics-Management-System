using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using Xunit;
using PortProject.Api.Models;
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Domain.VesselTypeAggregate;
using PortProject.Api.Domain.ResourceAggregate;
using PortProject.Api.Domain.QualificationAggregate;
using PortProject.Api.Application.Resources.DTOs;
using PortProject.Api.Application.Qualifications.DTOs;
using PortProject.Api.Application.VesselVisitNotification.DTOs;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using src.Dto;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;

namespace Port.Project.Api.System_Tests
{
    public class DataConsistencySystemTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
    {
        private readonly IntegrationTestsWebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public DataConsistencySystemTests(IntegrationTestsWebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false
            });
        }

        // Helper: generate a syntactically valid IMO (7 digits with correct check digit)
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

        // Helper: POST object as JSON and return HttpResponseMessage
        private async Task<HttpResponseMessage> PostJsonAsync(string url, object obj)
        {
            var content = new StringContent(JsonConvert.SerializeObject(obj), Encoding.UTF8, "application/json");
            return await _client.PostAsync(url, content);
        }

        // Helper: POST and deserialize response JSON to T; throws assertion with body on failure
        private async Task<T> PostAndReadJsonAsync<T>(string url, object obj)
        {
            var resp = await PostJsonAsync(url, obj);
            var body = await resp.Content.ReadAsStringAsync();
            Assert.True(resp.IsSuccessStatusCode, $"POST {url} failed: {resp.StatusCode}\n{body}");
            return JsonConvert.DeserializeObject<T>(body)!;
        }

        // Helper: GET and deserialize response JSON to T; throws assertion with body on failure
        private async Task<T> GetAndReadJsonAsync<T>(string url)
        {
            var resp = await _client.GetAsync(url);
            var body = await resp.Content.ReadAsStringAsync();
            Assert.True(resp.IsSuccessStatusCode, $"GET {url} failed: {resp.StatusCode}\n{body}");
            return JsonConvert.DeserializeObject<T>(body)!;
        }

        private void ReinitializeDb(Action<PortProjectContext>? beforeSave = null)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            // remove dependent data first
            if (db.VesselVisitNotifications.Any()) db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            if (db.Resources.Any()) db.Resources.RemoveRange(db.Resources);
            if (db.Qualifications.Any()) db.Qualifications.RemoveRange(db.Qualifications);
            if (db.Vessels.Any()) db.Vessels.RemoveRange(db.Vessels);
            if (db.ShippingAgentRepresentatives.Any()) db.ShippingAgentRepresentatives.RemoveRange(db.ShippingAgentRepresentatives);
            if (db.ShippingAgentOrganizations.Any()) db.ShippingAgentOrganizations.RemoveRange(db.ShippingAgentOrganizations);
            if (db.VesselTypes.Any()) db.VesselTypes.RemoveRange(db.VesselTypes);
            db.SaveChanges();

            // seed minimal vessel types
            db.VesselTypes.AddRange(new[]
            {
                VesselType.Create("1001", "Container Ship", "Seeded container ship", 5000, 10, 20, 8),
                VesselType.Create("1002", "Bulk Carrier", "Seeded bulk carrier", 8000, 12, 25, 10),
            });

            // seed minimal qualifications
            db.Qualifications.AddRange(new[]
            {
                new Qualification(new QualificationCode("QUAL001"), new QualificationName("Crane Operator"),
                    new QualificationDescription("Certified crane operator")),
                new Qualification(new QualificationCode("QUAL002"), new QualificationName("Truck Driver"),
                    new QualificationDescription("Licensed truck driver")),
            });

            beforeSave?.Invoke(db);

            db.SaveChanges();
        }

        [Fact(DisplayName = "System: Prevent deleting VesselType when dependent Vessels exist")]
        public async Task DeleteVesselType_WithExistingVessels_ShouldPreventDeletion()
        {
            // Arrange - reinit DB and create a vessel type via API
            ReinitializeDb();

            var newVt = new VesselTypeCreateDto
            {
                Id = "9001",
                Name = "Type To Delete",
                Description = "Test deletion",
                Capacity = 1234,
                MaxRows = 2,
                MaxBays = 2,
                MaxTiers = 2
            };

            var createdVt = await PostAndReadJsonAsync<VesselTypeDto>("/api/VesselType", newVt);

            // Create a vessel depending on this type using API
            var newVessel = new VesselCreateDto
            {
                ImoNumber = GenerateValidImo(333333),
                Name = "Dependent Vessel",
                VesselTypeId = createdVt.Id,
                Operator = "TestOp"
            };
            var createdV = await PostAndReadJsonAsync<VesselDto>("/api/Vessel", newVessel);
            Assert.NotNull(createdV);

            // Act - try to delete vessel type
            var deleteResp = await _client.DeleteAsync($"/api/VesselType/{createdVt.Id}");

            // Assert - should not allow deletion (BadRequest/Conflict/InternalServerError depending on implementation)
            Assert.True(deleteResp.StatusCode == HttpStatusCode.BadRequest ||
                        deleteResp.StatusCode == HttpStatusCode.Conflict ||
                        deleteResp.StatusCode == HttpStatusCode.InternalServerError,
                $"Unexpected status code: {deleteResp.StatusCode}");

            // Verify vessel type still exists
            var vtFetched = await GetAndReadJsonAsync<VesselTypeDto>($"/api/VesselType/{createdVt.Id}");
            Assert.NotNull(vtFetched);
        }

        [Fact(DisplayName = "System: Update Vessel should not break existing Vessel records referenced by other flows")]
        public async Task VesselUpdate_ShouldNotBreakExistingReferences()
        {
            ReinitializeDb();

            // Create vessel type via API
            var vt = new VesselTypeCreateDto
            {
                Id = "9100",
                Name = "Update Test Type",
                Description = "For update testing",
                Capacity = 2000,
                MaxRows = 3,
                MaxBays = 4,
                MaxTiers = 2
            };
            var vtDto = await PostAndReadJsonAsync<VesselTypeDto>("/api/VesselType", vt);
            var vtId = vtDto.Id;

            // Create vessel
            var imo = "4444448";
            var newVessel = new VesselCreateDto
            {
                ImoNumber = imo,
                Name = "Original Vessel Name",
                VesselTypeId = vtId,
                Operator = "OrigOp"
            };
            var created = await PostAndReadJsonAsync<VesselDto>("/api/Vessel", newVessel);
            Assert.NotNull(created);

            // Update vessel
            var updated = new VesselDto
            {
                ImoNumber = imo,
                Name = "Updated Vessel Name",
                VesselTypeId = vtId,
                Operator = "UpdatedOp"
            };
            var putResp = await _client.PutAsync($"/api/Vessel/{imo}",
                new StringContent(JsonConvert.SerializeObject(updated), Encoding.UTF8, "application/json"));
            var putBody = await putResp.Content.ReadAsStringAsync();
            Assert.True(putResp.IsSuccessStatusCode, $"PUT /api/Vessel/{imo} failed: {putResp.StatusCode}\n{putBody}");

            // Verify vessel still retrievable and updated
            var got = await GetAndReadJsonAsync<VesselDto>($"/api/Vessel/{imo}");
            Assert.NotNull(got);
            Assert.Equal("Updated Vessel Name", got.Name);
        }

        [Fact(DisplayName = "System: Complex query includes vessel types and returns expected results")]
        public async Task ComplexQueryScenario_MultipleFiltersAndIncludes_ShouldReturnCorrectData()
        {
            ReinitializeDb();

            // Create two vessel types and corresponding vessels
            var createdImos = new List<string>();
            for (int i = 0; i < 2; i++)
            {
                var vt = new VesselTypeCreateDto
                {
                    Id = $"920{i}",
                    Name = $"QueryType{i}",
                    Description = "",
                    Capacity = 1000 + i,
                    MaxRows = 2,
                    MaxBays = 2,
                    MaxTiers = 2
                };
                var vtDto = await PostAndReadJsonAsync<VesselTypeDto>("/api/VesselType", vt);
                var vtId = vtDto.Id;

                // generate a unique seed per vessel to avoid collisions
                var seed = Math.Abs(Guid.NewGuid().GetHashCode()) % 900000 + 100000; // six digits between 100000-999999
                var imo = GenerateValidImo(seed);
                var vessel = new VesselCreateDto
                {
                    ImoNumber = imo,
                    Name = $"Query Vessel {i}",
                    VesselTypeId = vtId,
                    Operator = "QryOp"
                };

                var createdVessel = await PostAndReadJsonAsync<VesselDto>("/api/Vessel", vessel);
                // record the actual IMO returned by the API (service may normalize)
                createdImos.Add(createdVessel.ImoNumber);
            }

            // Search vessels
            var resp = await _client.GetAsync("/api/Vessel/search?name=");
            resp.EnsureSuccessStatusCode();
            var body = await resp.Content.ReadAsStringAsync();

            // Try to deserialize response into VesselDto list (JsonConvert is case-insensitive)
            var vessels = JsonConvert.DeserializeObject<List<VesselDto>>(body);
            Assert.NotNull(vessels);

            // Ensure created IMOs are present in results and their types resolvable
            foreach (var createdImo in createdImos)
            {
                var foundVessel = vessels!.FirstOrDefault(v => v.ImoNumber == createdImo);
                Assert.NotNull(foundVessel);

                // verify vessel type exists via API
                var vtGet = await _client.GetAsync($"/api/VesselType/{foundVessel.VesselTypeId}");
                vtGet.EnsureSuccessStatusCode();
            }
        }

        [Fact(DisplayName = "System: Create Resource without Qualifications should succeed")]
        public async Task CreateResource_WithoutQualifications_ShouldSucceed()
        {
            // Arrange
            ReinitializeDb();

            var newResource = new CreateResourceDto
            {
                Code = "RES001",
                Description = "Test Resource Without Qualifications",
                Kind = "Crane",
                AssignedArea = "Area A",
                Status = "Active",
                SetupTimeMinutes = 30,
                OperationalWindowStart = new TimeOnly(8, 0),
                OperationalWindowEnd = new TimeOnly(18, 0),
                QualificationRequirements = null, // No qualifications
                AverageContainersPerHour = 50
            };

            // Act
            var createdResource = await PostAndReadJsonAsync<ResourceDto>("/api/Resource", newResource);

            // Assert
            Assert.NotNull(createdResource);
            Assert.Equal("RES001", createdResource.Code);
            Assert.True(createdResource.QualificationRequirements == null ||
                        createdResource.QualificationRequirements.Count == 0);
        }

        [Fact(DisplayName = "System: Create Resource with valid Qualification codes should succeed")]
        public async Task CreateResource_WithValidQualifications_ShouldSucceed()
        {
            // Arrange
            ReinitializeDb();

            // Create a qualification via API
            var qual = new CreateQualificationDto
            {
                Code = "CRANE_OP",
                Name = "Crane Operator Certification",
                Description = "Required for operating cranes"
            };
            var createdQual = await PostAndReadJsonAsync<QualificationDto>("/api/Qualifications", qual);

            // Create resource referencing the qualification
            var newResource = new CreateResourceDto
            {
                Code = "CRANE001",
                Description = "Main Port Crane",
                Kind = "Crane",
                AssignedArea = "Dock A",
                Status = "Active",
                SetupTimeMinutes = 45,
                OperationalWindowStart = new TimeOnly(6, 0),
                OperationalWindowEnd = new TimeOnly(22, 0),
                QualificationRequirements = new List<string> { createdQual.Code },
                AverageContainersPerHour = 60
            };

            // Act
            var createdResource = await PostAndReadJsonAsync<ResourceDto>("/api/Resource", newResource);

            // Assert
            Assert.NotNull(createdResource);
            Assert.Equal("CRANE001", createdResource.Code);
            Assert.NotNull(createdResource.QualificationRequirements);
            Assert.Contains(createdQual.Code, createdResource.QualificationRequirements);
        }

        [Fact(DisplayName = "System: Create Resource with multiple Qualifications should maintain all references")]
        public async Task CreateResource_WithMultipleQualifications_ShouldMaintainAllReferences()
        {
            // Arrange
            ReinitializeDb();

            // Create multiple qualifications
            var qual1 = new CreateQualificationDto
            {
                Code = "SAFETY_CERT",
                Name = "Safety Certification",
                Description = "General safety training"
            };
            var qual2 = new CreateQualificationDto
            {
                Code = "HEAVY_LIFT",
                Name = "Heavy Lifting License",
                Description = "License for heavy equipment"
            };

            var createdQual1 = await PostAndReadJsonAsync<QualificationDto>("/api/Qualifications", qual1);
            var createdQual2 = await PostAndReadJsonAsync<QualificationDto>("/api/Qualifications", qual2);

            // Create resource with both qualifications
            var newResource = new CreateResourceDto
            {
                Code = "TRUCK001",
                Description = "Heavy Duty Truck",
                Kind = "Truck",
                AssignedArea = "Yard B",
                Status = "Active",
                SetupTimeMinutes = 15,
                OperationalWindowStart = new TimeOnly(7, 0),
                OperationalWindowEnd = new TimeOnly(19, 0),
                QualificationRequirements = new List<string> { createdQual1.Code, createdQual2.Code },
                ContainersPerTrip = 2,
                AverageSpeedKmh = 30.0
            };

            // Act
            var createdResource = await PostAndReadJsonAsync<ResourceDto>("/api/Resource", newResource);

            // Assert
            Assert.NotNull(createdResource);
            Assert.Equal("TRUCK001", createdResource.Code);
            Assert.NotNull(createdResource.QualificationRequirements);
            Assert.Equal(2, createdResource.QualificationRequirements.Count);
            Assert.Contains(createdQual1.Code, createdResource.QualificationRequirements);
            Assert.Contains(createdQual2.Code, createdResource.QualificationRequirements);

            // Verify both qualifications still exist
            var qual1Fetched = await GetAndReadJsonAsync<QualificationDto>($"/api/Qualifications/{createdQual1.Code}");
            var qual2Fetched = await GetAndReadJsonAsync<QualificationDto>($"/api/Qualifications/{createdQual2.Code}");
            Assert.NotNull(qual1Fetched);
            Assert.NotNull(qual2Fetched);
        }


        // Query resource with qualifications returns data
        [Fact(DisplayName = "System: Query Resource with Qualifications should return correct data")]
        public async Task QueryResource_WithQualifications_ShouldReturnCorrectData()
        {
            // Arrange
            ReinitializeDb();
            // Create a qualification via API
            var qual = new CreateQualificationDto
            {
                Code = "FORKLIFT_OP",
                Name = "Forklift Operator Certification",
                Description = "Required for operating forklifts"
            };

            var createdQual = await PostAndReadJsonAsync<QualificationDto>("/api/Qualifications", qual);

            // Create resource referencing the qualification
            var newResource = new CreateResourceDto
            {
                Code = "crane001",
                Description = "Warehouse Crane",
                Kind = "Crane",
                AssignedArea = "Warehouse 1",
                Status = "Active",
                SetupTimeMinutes = 20,
                OperationalWindowStart = new TimeOnly(7, 0),
                OperationalWindowEnd = new TimeOnly(17, 0),
                QualificationRequirements = new List<string> { createdQual.Code },
                AverageContainersPerHour = 40
            };

            var createdResource = await PostAndReadJsonAsync<ResourceDto>("/api/Resource", newResource);
            // Act
            var queriedResource = await GetAndReadJsonAsync<ResourceDto>($"/api/Resource/{createdResource.Code}");
            // Assert
            Assert.NotNull(queriedResource);
            Assert.Equal("crane001", queriedResource.Code);
            Assert.NotNull(queriedResource.QualificationRequirements);
            Assert.Contains(createdQual.Code, queriedResource.QualificationRequirements);
        }

        [Fact(DisplayName = "System: Create VVN with Non-Existent Vessel IMO should fail")]
        public async Task CreateVVN_WithNonExistentVessel_ShouldReturnBadRequest()
        {
            // Arrange
            string? existingRepId = null; // Will be set after seeding Rep
            ReinitializeDb(db =>
            {
                // Seed Org & Rep needed for VVN creation
                var org = new ShippingAgentOrganization(OrganizationId.NewId(), new LegalName("FK Org"),
                    new AlternativeName("FKO"), new Address("FK St", "FK City", "FK Land"),
                    new TaxNumber("PT111222333"));
                var rep = new ShippingAgentRepresentative(new CitizenId("11111111Z"), new RepresentativeName("FK Rep"),
                    new RepresentativePhone("933444555"), new RepresentativeNationality("FKNat"),
                    new RepresentativeEmail("fk@test.com"));
                rep.AttachToOrganization(org.Id!);
                db.ShippingAgentOrganizations.Add(org);
                db.ShippingAgentRepresentatives.Add(rep);
                // We need to save here to get the Rep ID back
                db.SaveChanges();
                existingRepId = rep.RepresentativeId.Value.ToString();
            });
            Assert.NotNull(existingRepId); // Ensure Rep was created

            var nonExistentImo = GenerateValidImo(999999); // Use an IMO guaranteed not to exist
            var createDto = new CreateVvnDto
            {
                EstimatedArrival = DateTime.UtcNow.AddDays(1),
                EstimatedDeparture = DateTime.UtcNow.AddDays(2),
                VesselImo = nonExistentImo, // This vessel doesn't exist
                RepresentativeId = existingRepId,
                Cargo = new CreateCargoDto
                {
                    Description = "Bad Vessel", Weight = 1,
                    Containers = new List<CreateContainerDto>
                        { new CreateContainerDto { ContainerCode = "CSQU3054383", Position = "BV1" } }
                }
            };

            // Act
            var response = await PostJsonAsync("/api/notifications", createDto);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var body = await response.Content.ReadAsStringAsync();
            // Check for FK constraint message (might vary slightly based on DB/EF version)
            Assert.Contains("foreign key constraint failed", body, StringComparison.OrdinalIgnoreCase);
        }


        [Fact(DisplayName = "System: Create VVN with Non-Existent Representative ID should fail")]
        public async Task CreateVVN_WithNonExistentRepresentative_ShouldReturnBadRequest()
        {
            // Arrange
            string? existingVesselImo = null; // Will be set after seeding Vessel
            ReinitializeDb(db =>
            {
                // Seed Vessel (needs a VesselType seeded by default ReinitializeDb)
                var vessel = Vessel.Create(GenerateValidImo(888888), "FK Vessel", "1001", "FKOp");
                db.Vessels.Add(vessel);
                db.SaveChanges(); // Save to get the IMO
                existingVesselImo = vessel.ImoNumber.Value;
            });
            Assert.NotNull(existingVesselImo);

            var nonExistentRepId = Guid.NewGuid().ToString(); // Guaranteed not to exist
            var createDto = new CreateVvnDto
            {
                EstimatedArrival = DateTime.UtcNow.AddDays(1),
                EstimatedDeparture = DateTime.UtcNow.AddDays(2),
                VesselImo = existingVesselImo,
                RepresentativeId = nonExistentRepId, // This rep doesn't exist
                Cargo = new CreateCargoDto
                {
                    Description = "Bad Rep", Weight = 1,
                    Containers = new List<CreateContainerDto>
                        { new CreateContainerDto { ContainerCode = "CSQU3054383", Position = "BR1" } }
                }
            };

            // Act
            var response = await PostJsonAsync("/api/notifications", createDto);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var body = await response.Content.ReadAsStringAsync();
            Assert.Contains("foreign key constraint failed", body, StringComparison.OrdinalIgnoreCase);
        }

        // -------------------- NEW TESTS: Organization <-> Representative dependencies --------------------

        [Fact(DisplayName = "System: Create Representative with non-existent Organization should fail")]
        public async Task CreateRepresentative_WithNonExistentOrganization_ShouldFail()
        {
            ReinitializeDb();

            var bogusOrgId = Guid.NewGuid().ToString();
            var repCreate = new CreateShippingAgentRepresentativeDto
            {
                OrganizationId = bogusOrgId,
                RepresentativeName = "John Doe",
                CitizenId = "12345678Z",
                RepresentativeNationality = "PT",
                RepresentativeEmail = "john.doe@example.com",
                RepresentativePhone = "+351912345678"
            };

            var resp = await PostJsonAsync("/api/ShippingAgentRepresentatives", repCreate);
            // Depending on service/controller flow this can surface as BadRequest, NotFound or InternalServerError
            Assert.True(resp.StatusCode == HttpStatusCode.BadRequest ||
                        resp.StatusCode == HttpStatusCode.NotFound ||
                        resp.StatusCode == HttpStatusCode.InternalServerError,
                        $"Unexpected status code: {resp.StatusCode}");
            var body = await resp.Content.ReadAsStringAsync();
            Assert.True(
                body.Contains("not found", StringComparison.OrdinalIgnoreCase) ||
                body.Contains("invalid", StringComparison.OrdinalIgnoreCase) ||
                body.Contains("foreign key", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(body), // some pipelines may not return a message
                $"Unexpected error body: {body}");
        }

        [Fact(DisplayName = "System: Create Organization with representatives should persist and link reps to org")]
        public async Task CreateOrganization_WithRepresentatives_ShouldLinkRepresentatives()
        {
            ReinitializeDb();

            var orgCreate = new CreateShippingAgentOrganizationDto
            {
                LegalName = "Oceanic Shipping SA",
                AlternativeName = "Oceanic",
                Street = "Harbor St 1",
                City = "Porto",
                Country = "PT",
                TaxNumber = "PT999000111",
                Representatives = new List<CreateShippingAgentRepresentativeDto>
                {
                    new CreateShippingAgentRepresentativeDto
                    {
                        RepresentativeName = "Alice Rep",
                        CitizenId = "87654321X",
                        RepresentativeNationality = "PT",
                        RepresentativeEmail = "alice.rep@example.com",
                        RepresentativePhone = "934567890",
                        // OrganizationId is optional here; service assigns after creating the org
                    }
                }
            };

            var orgId = await PostAndReadJsonAsync<Guid>("/api/ShippingAgentOrganizations", orgCreate);
            Assert.NotEqual(Guid.Empty, orgId);

            // Verify the organization exists
            var orgDto = await GetAndReadJsonAsync<ShippingAgentOrganizationDto>($"/api/ShippingAgentOrganizations/{orgId}");
            Assert.NotNull(orgDto);
            Assert.Equal("Oceanic Shipping SA", orgDto.LegalName);

            // Verify there is at least one representative linked to this organization
            var repsResp = await _client.GetAsync($"/api/ShippingAgentRepresentatives/by-organization/{orgId}");
            Assert.True(repsResp.IsSuccessStatusCode, $"GET reps by organization failed: {repsResp.StatusCode}");
            var repsBody = await repsResp.Content.ReadAsStringAsync();
            var reps = JsonConvert.DeserializeObject<List<ShippingAgentRepresentativeDto>>(repsBody) ?? new List<ShippingAgentRepresentativeDto>();
            Assert.NotEmpty(reps);
            Assert.All(reps, r => Assert.Equal(orgId.ToString(), r.OrganizationId));
        }

        [Fact(DisplayName = "System: Delete Representative should not delete its Organization")]
        public async Task DeleteRepresentative_ShouldNotDeleteOrganization()
        {
            ReinitializeDb();

            // First create an organization with a representative
            var createOrg = new CreateShippingAgentOrganizationDto
            {
                LegalName = "Harbor Co.",
                AlternativeName = "Harbor",
                Street = "Dock 5",
                City = "Lisbon",
                Country = "PT",
                TaxNumber = "PT321654987",
                Representatives = new List<CreateShippingAgentRepresentativeDto>
                {
                    new CreateShippingAgentRepresentativeDto
                    {
                        RepresentativeName = "Bob Rep",
                        CitizenId = "99887766H",
                        RepresentativeNationality = "PT",
                        RepresentativeEmail = "bob.rep@example.com",
                        RepresentativePhone = "911111111",
                    }
                }
            };

            var orgId = await PostAndReadJsonAsync<Guid>("/api/ShippingAgentOrganizations", createOrg);
            Assert.NotEqual(Guid.Empty, orgId);

            // Fetch representatives of that organization and pick one
            var reps = await GetAndReadJsonAsync<List<ShippingAgentRepresentativeDto>>($"/api/ShippingAgentRepresentatives/by-organization/{orgId}");
            Assert.NotEmpty(reps);
            var repId = reps.First().RepresentativeId;

            // Delete representative
            var delResp = await _client.DeleteAsync($"/api/ShippingAgentRepresentatives/{repId}");
            Assert.Equal(HttpStatusCode.NoContent, delResp.StatusCode);

            // Organization should still exist
            var orgGet = await _client.GetAsync($"/api/ShippingAgentOrganizations/{orgId}");
            Assert.Equal(HttpStatusCode.OK, orgGet.StatusCode);
        }
    }
}
