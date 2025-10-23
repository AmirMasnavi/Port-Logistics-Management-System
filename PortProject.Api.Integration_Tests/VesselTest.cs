using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using Xunit;
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Models;
using PortProject.Api.Integration_Tests.Helpers;
using System.Net.Http;
using System.Threading.Tasks;

namespace PortProject.Api.Integration_Tests;

public class VesselTest : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
{
    private readonly IntegrationTestsWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public VesselTest(IntegrationTestsWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Theory]
    [InlineData("/api/Vessel/search?name=container")]
    public async Task Get_SearchByName_ReturnsResults(string url)
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            // Ensure VesselTypes seeded so vessels can reference them
            VesselTypeUtilities.ReinitializeDbForTests(db);
            // Seed some vessels
            db.Vessels.RemoveRange(db.Vessels);
            db.Vessels.AddRange(new[] {
                Vessel.Create("9000001", "Container Vessel A", "1001", "OperatorA"),
                Vessel.Create("9000002", "Other Vessel", "1002", "OperatorB")
            });
            db.SaveChanges();
        }

        var response = await _client.GetAsync(url);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.True(doc.RootElement.GetArrayLength() >= 1);
    }

    [Fact]
    public async Task Post_CreateVessel_ReturnsCreated()
    {
        // Arrange - ensure vessel type exists
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            VesselTypeUtilities.ReinitializeDbForTests(db);
            db.Vessels.RemoveRange(db.Vessels);
            db.SaveChanges();
        }

        var newVessel = new VesselCreateDto
        {
            ImoNumber = "1234567",
            Name = "Test Vessel",
            VesselTypeId = "1001",
            Operator = "TestOperator"
        };

        var jsonContent = JsonConvert.SerializeObject(newVessel);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/Vessel", content);
        response.EnsureSuccessStatusCode();
        Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        var created = JsonConvert.DeserializeObject<VesselDto>(body);
        Assert.NotNull(created);
        Assert.Equal(newVessel.ImoNumber, created.ImoNumber);
        Assert.Equal(newVessel.Name, created.Name);
    }

    [Fact]
    public async Task Get_ByImo_ReturnsVessel()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            VesselTypeUtilities.ReinitializeDbForTests(db);
            db.Vessels.RemoveRange(db.Vessels);
            db.Vessels.Add(Vessel.Create("8000001", "Lookup Vessel", "1001", "Op"));
            db.SaveChanges();
        }

        var response = await _client.GetAsync("/api/Vessel/8000001");
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync();
        var vessel = JsonConvert.DeserializeObject<VesselDto>(body);
        Assert.NotNull(vessel);
        Assert.Equal("8000001", vessel.ImoNumber);
        Assert.Equal("Lookup Vessel", vessel.Name);
    }

    [Fact]
    public async Task Put_UpdateVessel_ReturnsOk()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            VesselTypeUtilities.ReinitializeDbForTests(db);
            db.Vessels.RemoveRange(db.Vessels);
            db.Vessels.Add(Vessel.Create("7000001", "Old Name", "1001", "OpOld"));
            db.SaveChanges();
        }

        var updated = new VesselDto
        {
            ImoNumber = "7000001",
            Name = "New Name",
            VesselTypeId = "1001",
            Operator = "OpNew"
        };

        var jsonContent = JsonConvert.SerializeObject(updated);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        var response = await _client.PutAsync("/api/Vessel/7000001", content);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<VesselDto>(body);
        Assert.NotNull(result);
        Assert.Equal("New Name", result.Name);
        Assert.Equal("OpNew", result.Operator);
    }

    [Fact]
    public async Task Delete_Vessel_ReturnsNoContent()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            VesselTypeUtilities.ReinitializeDbForTests(db);
            db.Vessels.RemoveRange(db.Vessels);
            db.Vessels.Add(Vessel.Create("6000001", "ToDelete", "1001", "Op"));
            db.SaveChanges();
        }

        var deleteResponse = await _client.DeleteAsync("/api/Vessel/6000001");
        deleteResponse.EnsureSuccessStatusCode();
        Assert.Equal(System.Net.HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await _client.GetAsync("/api/Vessel/6000001");
        Assert.Equal(System.Net.HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task Put_ImoMismatch_ReturnsBadRequest()
    {
        var vessel = new VesselDto
        {
            ImoNumber = "5000001",
            Name = "Mismatch",
            VesselTypeId = "1001",
            Operator = "Op"
        };

        var jsonContent = JsonConvert.SerializeObject(vessel);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        var response = await _client.PutAsync("/api/Vessel/9999999", content);
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_InvalidImo_ReturnsBadRequest()
    {
        // Invalid IMO format (not numeric/length)
        var invalid = new VesselCreateDto
        {
            ImoNumber = "ABC1234",
            Name = "Bad IMO",
            VesselTypeId = "1001",
            Operator = "Op"
        };

        var jsonContent = JsonConvert.SerializeObject(invalid);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        var response = await _client.PostAsync("/api/Vessel", content);
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }
}
