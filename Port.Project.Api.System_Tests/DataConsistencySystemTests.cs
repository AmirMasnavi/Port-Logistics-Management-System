using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using Xunit;
using PortProject.Api.Models;
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Domain.VesselTypeAggregate;
using src.Dto;

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
            if (db.Vessels.Any()) db.Vessels.RemoveRange(db.Vessels);
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
            var putResp = await _client.PutAsync($"/api/Vessel/{imo}", new StringContent(JsonConvert.SerializeObject(updated), Encoding.UTF8, "application/json"));
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
    }
}
