using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using Xunit;
using src.Dto;
using PortProject.Api.Models;
using PortProject.Api.Integration_Tests.Helpers;
using System.Net.Http;
using System.Threading.Tasks;

namespace PortProject.Api.Integration_Tests;

public class VesselTypeTest : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
{
    private readonly IntegrationTestsWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public VesselTypeTest(IntegrationTestsWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Theory]
    [InlineData("/api/VesselType")]
    public async Task Get_EndpointsReturnSuccessAndCorrectContentType(string url)
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        // Act
        var response = await _client.GetAsync(url);

        // Assert
        response.EnsureSuccessStatusCode();
        var contentType = response.Content.Headers.ContentType?.ToString();
        Assert.Equal("application/json; charset=utf-8", contentType);
    }

    [Fact]
    public async Task Get_ReturnAllVesselTypes()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        // Act
        var response = await _client.GetAsync("/api/VesselType");

        // Assert
        var responseBody = await response.Content.ReadAsStringAsync();
        Assert.NotNull(responseBody);

        var jsonDocument = JsonDocument.Parse(responseBody);
        var jsonArray = jsonDocument.RootElement;

        Assert.True(jsonArray.ValueKind == JsonValueKind.Array, "Response body is not a JSON array");
        Assert.True(jsonArray.GetArrayLength() >= 3);
    }

    [Fact]
    public async Task Get_VesselTypeById_ReturnsCorrectVesselType()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        // Act
        var response = await _client.GetAsync("/api/VesselType/1001");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var vesselType = JsonConvert.DeserializeObject<VesselTypeDto>(responseBody);

        Assert.NotNull(vesselType);
        Assert.Equal("1001", vesselType.Id);
        Assert.Equal("Container Ship", vesselType.Name);
        Assert.Equal(5000, vesselType.Capacity);
    }

    [Fact]
    public async Task Get_VesselTypeById_NotFound_Returns404()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        // Act
        var response = await _client.GetAsync("/api/VesselType/9999");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Post_CreatesVesselType()
    {
        // Arrange
        var newVesselType = new VesselTypeCreateDto
        {
            Id = "2001",
            Name = "Cargo Ship",
            Description = "Medium-sized cargo vessel",
            Capacity = 4000,
            MaxRows = 9,
            MaxBays = 18,
            MaxTiers = 7
        };

        var jsonContent = JsonConvert.SerializeObject(newVesselType);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/VesselType", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var createdVesselType = JsonConvert.DeserializeObject<VesselTypeDto>(responseBody);

        Assert.NotNull(createdVesselType);
        Assert.Equal("2001", createdVesselType.Id);
        Assert.Equal("Cargo Ship", createdVesselType.Name);
        Assert.Equal(4000, createdVesselType.Capacity);
    }

    [Fact]
    public async Task Post_InvalidId_ReturnsBadRequest()
    {
        // Arrange
        var invalidVesselType = new VesselTypeCreateDto
        {
            Id = "ABC123", // ID com letras (inválido)
            Name = "Test Ship",
            Description = "Test",
            Capacity = 1000,
            MaxRows = 5,
            MaxBays = 10,
            MaxTiers = 5
        };

        var jsonContent = JsonConvert.SerializeObject(invalidVesselType);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/VesselType", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_EmptyName_ReturnsBadRequest()
    {
        // Arrange
        var invalidVesselType = new VesselTypeCreateDto
        {
            Id = "3001",
            Name = "", // Nome vazio
            Description = "Test",
            Capacity = 1000,
            MaxRows = 5,
            MaxBays = 10,
            MaxTiers = 5
        };

        var jsonContent = JsonConvert.SerializeObject(invalidVesselType);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/VesselType", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_UpdatesVesselType()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        var updatedVesselType = new VesselTypeDto
        {
            Id = "1001",
            Name = "Updated Container Ship",
            Description = "Updated description",
            Capacity = 6000,
            MaxRows = 11,
            MaxBays = 22,
            MaxTiers = 9
        };

        var jsonContent = JsonConvert.SerializeObject(updatedVesselType);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PutAsync("/api/VesselType/1001", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<VesselTypeDto>(responseBody);

        Assert.NotNull(result);
        Assert.Equal("Updated Container Ship", result.Name);
        Assert.Equal(6000, result.Capacity);
    }

    [Fact]
    public async Task Put_IdMismatch_ReturnsBadRequest()
    {
        // Arrange
        var vesselType = new VesselTypeDto
        {
            Id = "1001",
            Name = "Test",
            Description = "Test",
            Capacity = 1000,
            MaxRows = 5,
            MaxBays = 10,
            MaxTiers = 5
        };

        var jsonContent = JsonConvert.SerializeObject(vesselType);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PutAsync("/api/VesselType/9999", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Delete_RemovesVesselType()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        // Act
        HttpResponseMessage deleteResponse = await _client.DeleteAsync("/api/VesselType/1001");

        // Assert
        deleteResponse.EnsureSuccessStatusCode();
        Assert.Equal(System.Net.HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // Verify deletion
        var getResponse = await _client.GetAsync("/api/VesselType/1001");
        Assert.Equal(System.Net.HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task Delete_NonExistentVesselType_ReturnsNotFound()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        // Act
        HttpResponseMessage response = await _client.DeleteAsync("/api/VesselType/9999");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_Search_ReturnsMatchingVesselTypes()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        // Act
        var response = await _client.GetAsync("/api/VesselType/search?searchTerm=container");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var jsonDocument = JsonDocument.Parse(responseBody);
        var jsonArray = jsonDocument.RootElement;

        Assert.True(jsonArray.ValueKind == JsonValueKind.Array);
        Assert.True(jsonArray.GetArrayLength() >= 1);
    }

    [Fact]
    public async Task Get_Search_EmptyTerm_ReturnsAllVesselTypes()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        // Act
        var response = await _client.GetAsync("/api/VesselType/search?searchTerm=");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var jsonDocument = JsonDocument.Parse(responseBody);
        var jsonArray = jsonDocument.RootElement;

        Assert.True(jsonArray.ValueKind == JsonValueKind.Array);
        Assert.True(jsonArray.GetArrayLength() >= 3);
    }
}