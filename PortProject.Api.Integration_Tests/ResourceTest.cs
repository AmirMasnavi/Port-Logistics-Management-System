using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using Xunit;
using PortProject.Api.Domain.ResourceAggregate;
using PortProject.Api.Application.Resources.DTOs;
using PortProject.Api.Models;

namespace PortProject.Api.Integration_Tests;

public class ResourceTest : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
{
    private readonly IntegrationTestsWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ResourceTest(IntegrationTestsWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    private void ReinitializeResourcesDb(PortProjectContext db)
    {
        // Remove existing resources
        db.Resources.RemoveRange(db.Resources);
        db.SaveChanges();

        // Add seed resources
        db.Resources.AddRange(new[]
        {
            new Resource(
                new ResourceCode("crane001"),
                new ResourceDescription("Main Dock Crane"),
                ResourceKind.Crane,
                "Dock A",
                ResourceOperationalCapacity.ForCrane(50),
                ResourceStatus.Active,
                new ResourceSetupTime(30),
                new ResourceOperationalWindow(new TimeOnly(8, 0), new TimeOnly(18, 0)),
                new List<string> { "CRANE_OPERATOR" }
            ),
            new Resource(
                new ResourceCode("truck001"),
                new ResourceDescription("Container Transport Truck"),
                ResourceKind.Truck,
                "Yard B",
                ResourceOperationalCapacity.ForTruck(10, 25.0),
                ResourceStatus.Active,
                new ResourceSetupTime(15),
                new ResourceOperationalWindow(new TimeOnly(6, 0), new TimeOnly(20, 0)),
                new List<string> { "TRUCK_DRIVER" }
            ),
            new Resource(
                new ResourceCode("forklift001"),
                new ResourceDescription("Warehouse Forklift"),
                ResourceKind.Other,
                "Warehouse C",
                ResourceOperationalCapacity.ForOther("tons", 5.0),
                ResourceStatus.Inactive,
                new ResourceSetupTime(10),
                new ResourceOperationalWindow(new TimeOnly(7, 0), new TimeOnly(17, 0)),
                new List<string> { "FORKLIFT_OPERATOR" }
            ),
        });
        db.SaveChanges();
    }

    [Fact]
    public async Task Get_ResourceByCode_ReturnsCorrectResource()
    {
        // Arrange
        string resourceCode;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeResourcesDb(db);
            resourceCode = db.Resources.First().Code.Value;
        }

        // Act
        var response = await _client.GetAsync($"/api/Resource/{resourceCode}");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var resource = JsonConvert.DeserializeObject<ResourceDto>(responseBody);

        Assert.NotNull(resource);
        Assert.Equal(resourceCode, resource.Code);
        Assert.NotNull(resource.Description);
        Assert.NotNull(resource.Kind);
    }

    [Fact]
    public async Task Get_ResourceByCode_NotFound_Returns404()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeResourcesDb(db);
        }

        // Act
        var response = await _client.GetAsync("/api/Resource/nonexistent999");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Post_CreatesCraneResource()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeResourcesDb(db);
        }

        var newResource = new CreateResourceDto
        {
            Code = "crane002",
            Description = "Secondary Dock Crane",
            Kind = "Crane",
            AssignedArea = "Dock B",
            Status = "Active",
            SetupTimeMinutes = 25,
            OperationalWindowStart = new TimeOnly(8, 0),
            OperationalWindowEnd = new TimeOnly(18, 0),
            AverageContainersPerHour = 45,
            QualificationRequirements = new List<string> { "CRANE_OPERATOR", "SAFETY_CERT" }
        };

        var jsonContent = JsonConvert.SerializeObject(newResource);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Resource", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var createdResource = JsonConvert.DeserializeObject<ResourceDto>(responseBody);

        Assert.NotNull(createdResource);
        Assert.Equal("crane002", createdResource.Code);
        Assert.Equal("Secondary Dock Crane", createdResource.Description);
        Assert.Equal("Crane", createdResource.Kind);
        Assert.Equal("Dock B", createdResource.AssignedArea);
        Assert.Equal(45, createdResource.AverageContainersPerHour);
    }

    [Fact]
    public async Task Post_CreatesTruckResource()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeResourcesDb(db);
        }

        var newResource = new CreateResourceDto
        {
            Code = "truck002",
            Description = "Cargo Transport Truck",
            Kind = "Truck",
            AssignedArea = "Yard A",
            Status = "Active",
            SetupTimeMinutes = 20,
            OperationalWindowStart = new TimeOnly(7, 0),
            OperationalWindowEnd = new TimeOnly(19, 0),
            ContainersPerTrip = 8,
            AverageSpeedKmh = 30.0,
            QualificationRequirements = new List<string> { "TRUCK_DRIVER" }
        };

        var jsonContent = JsonConvert.SerializeObject(newResource);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Resource", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var createdResource = JsonConvert.DeserializeObject<ResourceDto>(responseBody);

        Assert.NotNull(createdResource);
        Assert.Equal("truck002", createdResource.Code);
        Assert.Equal("Cargo Transport Truck", createdResource.Description);
        Assert.Equal("Truck", createdResource.Kind);
        Assert.Equal(8, createdResource.ContainersPerTrip);
        Assert.Equal(30.0, createdResource.AverageSpeedKmh);
    }

    [Fact]
    public async Task Post_CreatesOtherResource()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeResourcesDb(db);
        }

        var newResource = new CreateResourceDto
        {
            Code = "loader001",
            Description = "Cargo Loader",
            Kind = "Other",
            AssignedArea = "Warehouse A",
            Status = "Active",
            SetupTimeMinutes = 15,
            OperationalWindowStart = new TimeOnly(6, 0),
            OperationalWindowEnd = new TimeOnly(22, 0),
            OtherUnit = "pallets",
            OtherGenericValue = 100.0,
            QualificationRequirements = new List<string> { "LOADER_OPERATOR" }
        };

        var jsonContent = JsonConvert.SerializeObject(newResource);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Resource", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var createdResource = JsonConvert.DeserializeObject<ResourceDto>(responseBody);

        Assert.NotNull(createdResource);
        Assert.Equal("loader001", createdResource.Code);
        Assert.Equal("Cargo Loader", createdResource.Description);
        Assert.Equal("Other", createdResource.Kind);
        Assert.Equal("pallets", createdResource.OtherUnit);
        Assert.Equal(100.0, createdResource.OtherGenericValue);
    }

    [Fact]
    public async Task Post_EmptyCode_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeResourcesDb(db);
        }

        var invalidResource = new CreateResourceDto
        {
            Code = "",
            Description = "Test Resource",
            Kind = "Crane",
            Status = "Active",
            SetupTimeMinutes = 30,
            OperationalWindowStart = new TimeOnly(8, 0),
            OperationalWindowEnd = new TimeOnly(18, 0),
            AverageContainersPerHour = 50
        };

        var jsonContent = JsonConvert.SerializeObject(invalidResource);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Resource", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_NullCode_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeResourcesDb(db);
        }

        var invalidResource = new CreateResourceDto
        {
            Code = null,
            Description = "Test Resource",
            Kind = "Crane",
            Status = "Active",
            SetupTimeMinutes = 30,
            OperationalWindowStart = new TimeOnly(8, 0),
            OperationalWindowEnd = new TimeOnly(18, 0),
            AverageContainersPerHour = 50
        };

        var jsonContent = JsonConvert.SerializeObject(invalidResource);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Resource", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_EmptyDescription_ReturnsCreated()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeResourcesDb(db);
        }

        var invalidResource = new CreateResourceDto
        {
            Code = "crane003",
            Description = "",
            Kind = "Crane",
            Status = "Active",
            SetupTimeMinutes = 30,
            OperationalWindowStart = new TimeOnly(8, 0),
            OperationalWindowEnd = new TimeOnly(18, 0),
            AverageContainersPerHour = 50
        };

        var jsonContent = JsonConvert.SerializeObject(invalidResource);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Resource", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Post_InvalidKind_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeResourcesDb(db);
        }

        var invalidResource = new CreateResourceDto
        {
            Code = "resource001",
            Description = "Test Resource",
            Kind = "InvalidKind",
            Status = "Active",
            SetupTimeMinutes = 30,
            OperationalWindowStart = new TimeOnly(8, 0),
            OperationalWindowEnd = new TimeOnly(18, 0)
        };

        var jsonContent = JsonConvert.SerializeObject(invalidResource);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Resource", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_InvalidStatus_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeResourcesDb(db);
        }

        var invalidResource = new CreateResourceDto
        {
            Code = "crane004",
            Description = "Test Crane",
            Kind = "Crane",
            Status = "InvalidStatus",
            SetupTimeMinutes = 30,
            OperationalWindowStart = new TimeOnly(8, 0),
            OperationalWindowEnd = new TimeOnly(18, 0),
            AverageContainersPerHour = 50
        };

        var jsonContent = JsonConvert.SerializeObject(invalidResource);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Resource", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_NegativeSetupTime_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeResourcesDb(db);
        }

        var invalidResource = new CreateResourceDto
        {
            Code = "crane005",
            Description = "Test Crane",
            Kind = "Crane",
            Status = "Active",
            SetupTimeMinutes = -10,
            OperationalWindowStart = new TimeOnly(8, 0),
            OperationalWindowEnd = new TimeOnly(18, 0),
            AverageContainersPerHour = 50
        };

        var jsonContent = JsonConvert.SerializeObject(invalidResource);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/Resource", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_ResourceByCode_ReturnsSuccessAndCorrectContentType()
    {
        // Arrange
        string resourceCode;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeResourcesDb(db);
            resourceCode = db.Resources.First().Code.Value;
        }

        // Act
        var response = await _client.GetAsync($"/api/Resource/{resourceCode}");

        // Assert
        response.EnsureSuccessStatusCode();
        var contentType = response.Content.Headers.ContentType?.ToString();
        Assert.Equal("application/json; charset=utf-8", contentType);
    }
}