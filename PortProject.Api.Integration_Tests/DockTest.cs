using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using Xunit;
using PortProject.Api.Models;
using PortProject.Api.Integration_Tests.Helpers;
using PortProject.Api.Application.Dock.DTOs;
using PortProject.Api.Domain.DockAggregate;

namespace PortProject.Api.Integration_Tests;

public class DockTest : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
{
    private readonly IntegrationTestsWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public DockTest(IntegrationTestsWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Theory]
    [InlineData("/api/Dock")]
    public async Task Get_EndpointsReturnSuccessAndCorrectContentType(string url)
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            // Remove dependent entities to avoid FK constraints
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        // Act
        HttpResponseMessage response = await _client.GetAsync(url);

        // Assert
        response.EnsureSuccessStatusCode();
        var contentType = response.Content.Headers.ContentType?.ToString();
        Assert.Equal("application/json; charset=utf-8", contentType);
    }

    [Fact]
    public async Task Get_ReturnAllDocks()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            // Remove dependent entities to avoid FK constraints
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
            // Seed docks
            db.Docks.AddRange(new[]
            {
                Dock.Create("DOCK1", "Main Dock", "Zone A", "Section 1", 300, 15, 12, 2, new List<string> { "1001", "1002" }),
                Dock.Create("DOCK2", "Secondary Dock", "Zone B", "Section 2", 250, 10, 8, 1, new List<string> { "1002" }),
                Dock.Create("DOCK3", "Tanker Dock", "Zone C", "Section 3", 400, 20, 15, 3, new List<string> { "1003" })
            });
            db.SaveChanges();
        }

        // Act
        HttpResponseMessage response = await _client.GetAsync("/api/Dock");

        // Assert
        var responseBody = await response.Content.ReadAsStringAsync();
        Assert.NotNull(responseBody);

        var jsonDocument = JsonDocument.Parse(responseBody);
        var jsonArray = jsonDocument.RootElement;

        Assert.True(jsonArray.ValueKind == JsonValueKind.Array, "Response body is not a JSON array");
        Assert.True(jsonArray.GetArrayLength() >= 3);
    }

    [Fact]
    public async Task Get_DockById_ReturnsCorrectDock()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
            db.Docks.Add(Dock.Create("DOCK1", "Main Dock", "Zone A", "Section 1", 300, 15, 12, 2, new List<string> { "1001", "1002" }));
            db.SaveChanges();
        }

        // Act
        HttpResponseMessage response = await _client.GetAsync("/api/Dock/DOCK1");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var dock = JsonConvert.DeserializeObject<DockDto>(responseBody);

        Assert.NotNull(dock);
        Assert.Equal("DOCK1", dock.Id);
        Assert.Equal("Main Dock", dock.Name);
        Assert.Equal("Zone A", dock.LocationZone);
        Assert.Equal("Section 1", dock.LocationSection);
        Assert.Equal(300, dock.LengthInMeters);
        Assert.Equal(15, dock.DepthInMeters);
        Assert.Equal(12, dock.MaxDraftInMeters);
        Assert.Equal(2, dock.NumberOfSTSCranes);
        Assert.Contains("1001", dock.AllowedVesselTypeIds);
        Assert.Contains("1002", dock.AllowedVesselTypeIds);
    }

    [Fact]
    public async Task Get_DockById_NotFound_Returns404()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        // Act
        HttpResponseMessage response = await _client.GetAsync("/api/Dock/NONEXISTENT");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Post_CreatesDock()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        var newDock = new DockCreateDto
        {
            Id = "DOCK4",
            Name = "New Dock",
            LocationZone = "Zone D",
            LocationSection = "Section 4",
            LengthInMeters = 350,
            DepthInMeters = 18,
            MaxDraftInMeters = 14,
            NumberOfSTSCranes = 2,
            AllowedVesselTypeIds = new List<string> { "1001", "1003" }
        };

        var jsonContent = JsonConvert.SerializeObject(newDock);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Dock", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var createdDock = JsonConvert.DeserializeObject<DockDto>(responseBody);

        Assert.NotNull(createdDock);
        Assert.Equal("DOCK4", createdDock.Id);
        Assert.Equal("New Dock", createdDock.Name);
        Assert.Equal("Zone D", createdDock.LocationZone);
        Assert.Equal("Section 4", createdDock.LocationSection);
        Assert.Equal(350, createdDock.LengthInMeters);
        Assert.Equal(18, createdDock.DepthInMeters);
        Assert.Equal(14, createdDock.MaxDraftInMeters);
        Assert.Equal(2, createdDock.NumberOfSTSCranes);
        Assert.Contains("1001", createdDock.AllowedVesselTypeIds);
        Assert.Contains("1003", createdDock.AllowedVesselTypeIds);
    }

    [Fact]
    public async Task Post_EmptyName_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        var invalidDock = new DockCreateDto
        {
            Id = "DOCK5",
            Name = "", // Empty name
            LocationZone = "Zone E",
            LocationSection = "Section 5",
            LengthInMeters = 200,
            DepthInMeters = 10,
            MaxDraftInMeters = 8,
            NumberOfSTSCranes = 1,
            AllowedVesselTypeIds = new List<string> { "1001" }
        };

        var jsonContent = JsonConvert.SerializeObject(invalidDock);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Dock", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_NegativePhysicalCharacteristics_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        var invalidDock = new DockCreateDto
        {
            Id = "DOCK5",
            Name = "Invalid Dock",
            LocationZone = "Zone E",
            LocationSection = "Section 5",
            LengthInMeters = -200, // Negative length
            DepthInMeters = 10,
            MaxDraftInMeters = 8,
            NumberOfSTSCranes = 1,
            AllowedVesselTypeIds = new List<string> { "1001" }
        };

        var jsonContent = JsonConvert.SerializeObject(invalidDock);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Dock", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_InvalidVesselTypeId_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        var invalidDock = new DockCreateDto
        {
            Id = "DOCK5",
            Name = "Invalid Dock",
            LocationZone = "Zone E",
            LocationSection = "Section 5",
            LengthInMeters = 200,
            DepthInMeters = 10,
            MaxDraftInMeters = 8,
            NumberOfSTSCranes = 1,
            AllowedVesselTypeIds = new List<string> { "9999" } // Non-existent VesselType ID
        };

        var jsonContent = JsonConvert.SerializeObject(invalidDock);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Dock", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_UpdatesDock()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
            db.Docks.Add(Dock.Create("DOCK1", "Main Dock", "Zone A", "Section 1", 300, 15, 12, 2, new List<string> { "1001", "1002" }));
            db.SaveChanges();
        }

        var updatedDock = new DockDto
        {
            Id = "DOCK1",
            Name = "Updated Main Dock",
            LocationZone = "Zone A Updated",
            LocationSection = "Section 1 Updated",
            LengthInMeters = 320,
            DepthInMeters = 16,
            MaxDraftInMeters = 13,
            NumberOfSTSCranes = 3,
            AllowedVesselTypeIds = new List<string> { "1002", "1003" }
        };

        var jsonContent = JsonConvert.SerializeObject(updatedDock);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PutAsync("/api/Dock/DOCK1", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<DockDto>(responseBody);

        Assert.NotNull(result);
        Assert.Equal("Updated Main Dock", result.Name);
        Assert.Equal("Zone A Updated", result.LocationZone);
        Assert.Equal("Section 1 Updated", result.LocationSection);
        Assert.Equal(320, result.LengthInMeters);
        Assert.Equal(16, result.DepthInMeters);
        Assert.Equal(13, result.MaxDraftInMeters);
        Assert.Equal(3, result.NumberOfSTSCranes);
        Assert.Contains("1002", result.AllowedVesselTypeIds);
        Assert.Contains("1003", result.AllowedVesselTypeIds);
    }

    [Fact]
    public async Task Put_IdMismatch_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
            db.Docks.Add(Dock.Create("DOCK1", "Main Dock", "Zone A", "Section 1", 300, 15, 12, 2, new List<string> { "1001", "1002" }));
            db.SaveChanges();
        }

        var dock = new DockDto
        {
            Id = "DOCK1",
            Name = "Test Dock",
            LocationZone = "Zone T",
            LocationSection = "Section T",
            LengthInMeters = 200,
            DepthInMeters = 10,
            MaxDraftInMeters = 8,
            NumberOfSTSCranes = 1,
            AllowedVesselTypeIds = new List<string> { "1001" }
        };

        var jsonContent = JsonConvert.SerializeObject(dock);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PutAsync("/api/Dock/NONEXISTENT", content);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Delete_RemovesDock()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
            db.Docks.Add(Dock.Create("DOCK1", "Main Dock", "Zone A", "Section 1", 300, 15, 12, 2, new List<string> { "1001", "1002" }));
            db.SaveChanges();
        }

        // Act
        HttpResponseMessage deleteResponse = await _client.DeleteAsync("/api/Dock/DOCK1");

        // Assert
        deleteResponse.EnsureSuccessStatusCode();
        Assert.Equal(System.Net.HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // Verify deletion
        var getResponse = await _client.GetAsync("/api/Dock/DOCK1");
        Assert.Equal(System.Net.HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task Delete_NonExistentDock_ReturnsNotFound()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
        }

        // Act
        var response = await _client.DeleteAsync("/api/Dock/NONEXISTENT");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_Search_ReturnsMatchingDocks()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
            db.Docks.AddRange(new[]
            {
                Dock.Create("DOCK1", "Main Dock", "Zone A", "Section 1", 300, 15, 12, 2, new List<string> { "1001", "1002" }),
                Dock.Create("DOCK2", "Secondary Dock", "Zone B", "Section 2", 250, 10, 8, 1, new List<string> { "1002" }),
                Dock.Create("DOCK3", "Tanker Dock", "Zone C", "Section 3", 400, 20, 15, 3, new List<string> { "1003" })
            });
            db.SaveChanges();
        }

        // Act
        HttpResponseMessage response = await _client.GetAsync("/api/Dock/search?name=main");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var jsonDocument = JsonDocument.Parse(responseBody);
        var jsonArray = jsonDocument.RootElement;

        Assert.True(jsonArray.ValueKind == JsonValueKind.Array);
        Assert.True(jsonArray.GetArrayLength() >= 1);
    }

    [Fact]
    public async Task Get_Search_EmptyTerm_ReturnsAllDocks()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.Vessels.RemoveRange(db.Vessels);
            db.Docks.RemoveRange(db.Docks);
            db.SaveChanges();
            VesselTypeUtilities.ReinitializeDbForTests(db);
            db.Docks.AddRange(new[]
            {
                Dock.Create("DOCK1", "Main Dock", "Zone A", "Section 1", 300, 15, 12, 2, new List<string> { "1001", "1002" }),
                Dock.Create("DOCK2", "Secondary Dock", "Zone B", "Section 2", 250, 10, 8, 1, new List<string> { "1002" }),
                Dock.Create("DOCK3", "Tanker Dock", "Zone C", "Section 3", 400, 20, 15, 3, new List<string> { "1003" })
            });
            db.SaveChanges();
        }

        // Act
        HttpResponseMessage response = await _client.GetAsync("/api/Dock/search?name=");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var jsonDocument = JsonDocument.Parse(responseBody);
        var jsonArray = jsonDocument.RootElement;

        Assert.True(jsonArray.ValueKind == JsonValueKind.Array);
        Assert.True(jsonArray.GetArrayLength() >= 3);
    }
}