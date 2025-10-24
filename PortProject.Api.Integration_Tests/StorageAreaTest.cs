using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using Xunit;
using PortProject.Api.Domain.StorageAggregate;
using PortProject.Api.Application.StorageAreas.DTOs;
using PortProject.Api.Models;

namespace PortProject.Api.Integration_Tests;

public class StorageAreaTest : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
{
    private readonly IntegrationTestsWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public StorageAreaTest(IntegrationTestsWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    private void ReinitializeStorageAreasDb(PortProjectContext db)
    {
        // Remove existing storage areas
        db.StorageAreas.RemoveRange(db.StorageAreas);
        db.SaveChanges();

        // Add seed storage areas
        db.StorageAreas.AddRange(new[] {
            new StorageArea(
                new StorageAreaLocation(10, 20),
                StorageAreaType.Yard, 
                new StorageCapacity(100)
            ),
            new StorageArea(
                new StorageAreaLocation(30, 40), 
                StorageAreaType.Warehouse, 
                new StorageCapacity(200)
            ),
            new StorageArea(
                new StorageAreaLocation(50, 60), 
                StorageAreaType.Yard, 
                new StorageCapacity(150)
            ),
        });
        db.SaveChanges();
    }

    [Fact]
    public async Task Get_StorageAreaById_ReturnsCorrectStorageArea()
    {
        // Arrange
        int storageAreaId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeStorageAreasDb(db);
            storageAreaId = db.StorageAreas.First().Id.Value;
        }

        // Act
        var response = await _client.GetAsync($"/api/StorageArea/{storageAreaId}");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var storageArea = JsonConvert.DeserializeObject<StorageAreaDto>(responseBody);

        Assert.NotNull(storageArea);
        Assert.Equal(storageAreaId.ToString(), storageArea.Id);
        Assert.NotNull(storageArea.Type);
    }

    [Fact]
    public async Task Get_StorageAreaById_NotFound_Returns404()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeStorageAreasDb(db);
        }

        // Act
        var response = await _client.GetAsync("/api/StorageArea/99999");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Post_CreatesStorageArea()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeStorageAreasDb(db);
        }

        var newStorageArea = new CreateStorageAreaDto
        {
            Location = "70, 80",  // Use coordinate format instead of "D4"
            Type = "Yard",
            Capacity = 250
        };

        var jsonContent = JsonConvert.SerializeObject(newStorageArea);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/StorageArea", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var createdStorageArea = JsonConvert.DeserializeObject<StorageAreaDto>(responseBody);

        Assert.NotNull(createdStorageArea);
        Assert.Contains("70", createdStorageArea.Location);  // Check if coordinates are present
        Assert.Contains("80", createdStorageArea.Location);
        Assert.Equal("Yard", createdStorageArea.Type);
        Assert.Equal(250, createdStorageArea.Capacity);
    }

    [Fact]
    public async Task Post_WithWarehouseType_CreatesStorageArea()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeStorageAreasDb(db);
        }

        var newStorageArea = new CreateStorageAreaDto
        {
            Location = "90, 100",  // Use coordinate format instead of "E5"
            Type = "Warehouse",
            Capacity = 300
        };

        var jsonContent = JsonConvert.SerializeObject(newStorageArea);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/StorageArea", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var createdStorageArea = JsonConvert.DeserializeObject<StorageAreaDto>(responseBody);

        Assert.NotNull(createdStorageArea);
        Assert.Contains("90", createdStorageArea.Location);  // Check if coordinates are present
        Assert.Contains("100", createdStorageArea.Location);
        Assert.Equal("Warehouse", createdStorageArea.Type);
        Assert.Equal(300, createdStorageArea.Capacity);
    }

    [Fact]
    public async Task Post_EmptyLocation_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeStorageAreasDb(db);
        }

        var invalidStorageArea = new CreateStorageAreaDto
        {
            Location = "",
            Type = "Yard",
            Capacity = 100
        };

        var jsonContent = JsonConvert.SerializeObject(invalidStorageArea);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/StorageArea", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_NullLocation_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeStorageAreasDb(db);
        }

        var invalidStorageArea = new CreateStorageAreaDto
        {
            Location = null,
            Type = "Yard",
            Capacity = 100
        };

        var jsonContent = JsonConvert.SerializeObject(invalidStorageArea);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/StorageArea", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_ZeroCapacity_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeStorageAreasDb(db);
        }

        var invalidStorageArea = new CreateStorageAreaDto
        {
            Location = "110, 120",  // Use valid coordinate format
            Type = "Yard",
            Capacity = 0  // Invalid: zero capacity
        };

        var jsonContent = JsonConvert.SerializeObject(invalidStorageArea);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/StorageArea", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_NegativeCapacity_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeStorageAreasDb(db);
        }

        var invalidStorageArea = new CreateStorageAreaDto
        {
            Location = "130, 140",  // Use valid coordinate format
            Type = "Yard",
            Capacity = -50  // Invalid: negative capacity
        };

        var jsonContent = JsonConvert.SerializeObject(invalidStorageArea);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/StorageArea", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_InvalidType_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeStorageAreasDb(db);
        }

        var invalidStorageArea = new CreateStorageAreaDto
        {
            Location = "150, 160",  // Use valid coordinate format
            Type = "InvalidType",  // Invalid: not a valid StorageAreaType
            Capacity = 100
        };

        var jsonContent = JsonConvert.SerializeObject(invalidStorageArea);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/StorageArea", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_StorageAreaById_ReturnsSuccessAndCorrectContentType()
    {
        // Arrange
        int storageAreaId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeStorageAreasDb(db);
            storageAreaId = db.StorageAreas.First().Id.Value;
        }

        // Act
        var response = await _client.GetAsync($"/api/StorageArea/{storageAreaId}");

        // Assert
        response.EnsureSuccessStatusCode();
        var contentType = response.Content.Headers.ContentType?.ToString();
        Assert.Equal("application/json; charset=utf-8", contentType);
    }
}