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
using System.Linq;

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

    private void ReinitializeVesselsDb(PortProjectContext db)
    {
        // Remove existing vessels first to avoid FK constraint when changing vessel types
        db.Vessels.RemoveRange(db.Vessels);
        db.SaveChanges();

        // Ensure vessel types are present (re-seed after vessels removed)
        VesselTypeUtilities.ReinitializeDbForTests(db);

        // Add seed vessels (IMOs must be valid 7-digit numbers with correct check digit)
        db.Vessels.AddRange(new[] {
            Vessel.Create(imo: "1234567", name: "Evergreen", vesselTypeId: "1001", operatorName: "Evergreen Line"),
            Vessel.Create(imo: "1111117", name: "Maersk Alabama", vesselTypeId: "1002", operatorName: "Maersk"),
            Vessel.Create(imo: "2222224", name: "Tanker One", vesselTypeId: "1003", operatorName: "Oceanic"),
        });
        db.SaveChanges();
    }

    [Theory]
    [InlineData("/api/Vessel/search?name=")]
    public async Task Get_EndpointsReturnSuccessAndCorrectContentType(string url)
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeVesselsDb(db);
        }

        // Act
        var response = await _client.GetAsync(url);

        // Assert
        response.EnsureSuccessStatusCode();
        var contentType = response.Content.Headers.ContentType?.ToString();
        Assert.Equal("application/json; charset=utf-8", contentType);
    }

    [Fact]
    public async Task Get_ReturnAllVessels()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeVesselsDb(db);
        }

        // Act
        var response = await _client.GetAsync("/api/Vessel/search?name=");

        // Assert
        var responseBody = await response.Content.ReadAsStringAsync();
        Assert.NotNull(responseBody);

        var jsonDocument = JsonDocument.Parse(responseBody);
        var jsonArray = jsonDocument.RootElement;

        Assert.True(jsonArray.ValueKind == JsonValueKind.Array, "Response body is not a JSON array");
        Assert.True(jsonArray.GetArrayLength() >= 3);
    }

    [Fact]
    public async Task Get_VesselByImo_ReturnsCorrectVessel()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeVesselsDb(db);
        }

        // Act
        var response = await _client.GetAsync("/api/Vessel/1234567");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var vessel = JsonConvert.DeserializeObject<VesselDto>(responseBody);

        Assert.NotNull(vessel);
        Assert.Equal("1234567", vessel.ImoNumber);
        Assert.Equal("Evergreen", vessel.Name);
        Assert.Equal("1001", vessel.VesselTypeId);
    }

    [Fact]
    public async Task Get_VesselByImo_NotFound_Returns404()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeVesselsDb(db);
        }

        // Act
        // use a syntactically valid IMO that is not present in DB
        var response = await _client.GetAsync("/api/Vessel/4444448");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Post_CreatesVessel()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeVesselsDb(db);
        }

        var newVessel = new VesselCreateDto
        {
            ImoNumber = "3333331",
            Name = "New Vessel",
            VesselTypeId = "1001",
            Operator = "New Operator"
        };

        var jsonContent = JsonConvert.SerializeObject(newVessel);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Vessel", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var createdVessel = JsonConvert.DeserializeObject<VesselDto>(responseBody);

        Assert.NotNull(createdVessel);
        Assert.Equal("3333331", createdVessel.ImoNumber);
        Assert.Equal("New Vessel", createdVessel.Name);
        Assert.Equal("1001", createdVessel.VesselTypeId);
    }

    [Fact]
    public async Task Post_InvalidImo_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeVesselsDb(db);
        }

        var invalidVessel = new VesselCreateDto
        {
            ImoNumber = "ABC1234", // invalid format
            Name = "Test Vessel",
            VesselTypeId = "1001",
            Operator = "Test"
        };

        var jsonContent = JsonConvert.SerializeObject(invalidVessel);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Vessel", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_EmptyName_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeVesselsDb(db);
        }

        var invalidVessel = new VesselCreateDto
        {
            // use a valid IMO here so the request reaches name validation
            ImoNumber = "7777779",
            Name = "",
            VesselTypeId = "1001",
            Operator = "Test"
        };

        var jsonContent = JsonConvert.SerializeObject(invalidVessel);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Vessel", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_UpdatesVessel()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeVesselsDb(db);
        }

        var updatedVessel = new VesselDto
        {
            ImoNumber = "1234567",
            Name = "Evergreen Updated",
            VesselTypeId = "1002",
            Operator = "Evergreen Updated Operator"
        };

        var jsonContent = JsonConvert.SerializeObject(updatedVessel);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PutAsync("/api/Vessel/1234567", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<VesselDto>(responseBody);

        Assert.NotNull(result);
        Assert.Equal("Evergreen Updated", result.Name);
        Assert.Equal("1002", result.VesselTypeId);
    }

    [Fact]
    public async Task Put_IdMismatch_ReturnsBadRequest()
    {
        // Arrange
        var vessel = new VesselDto
        {
            ImoNumber = "1234567",
            Name = "Test",
            VesselTypeId = "1001",
            Operator = "Test"
        };

        var jsonContent = JsonConvert.SerializeObject(vessel);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PutAsync("/api/Vessel/9999999", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Delete_RemovesVessel()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeVesselsDb(db);
        }

        // Act
        HttpResponseMessage deleteResponse = await _client.DeleteAsync("/api/Vessel/1234567");

        // Assert
        deleteResponse.EnsureSuccessStatusCode();
        Assert.Equal(System.Net.HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // Verify deletion
        var getResponse = await _client.GetAsync("/api/Vessel/1234567");
        Assert.Equal(System.Net.HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task Delete_NonExistentVessel_ReturnsNotFound()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeVesselsDb(db);
        }

        // Act
        HttpResponseMessage response = await _client.DeleteAsync("/api/Vessel/4444448");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_Search_ReturnsMatchingVessels()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeVesselsDb(db);
        }

        // Act
        var response = await _client.GetAsync("/api/Vessel/search?name=evergreen");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var jsonDocument = JsonDocument.Parse(responseBody);
        var jsonArray = jsonDocument.RootElement;

        Assert.True(jsonArray.ValueKind == JsonValueKind.Array);
        Assert.True(jsonArray.GetArrayLength() >= 1);
    }

    [Fact]
    public async Task Get_Search_EmptyTerm_ReturnsAllVessels()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeVesselsDb(db);
        }

        // Act
        var response = await _client.GetAsync("/api/Vessel/search?name=");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var jsonDocument = JsonDocument.Parse(responseBody);
        var jsonArray = jsonDocument.RootElement;

        Assert.True(jsonArray.ValueKind == JsonValueKind.Array);
        Assert.True(jsonArray.GetArrayLength() >= 3);
    }
}
