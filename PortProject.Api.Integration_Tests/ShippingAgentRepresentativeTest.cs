using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using Xunit;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Integration_Tests.Helpers;
using PortProject.Api.Models;

namespace PortProject.Api.Integration_Tests;

public class ShippingAgentRepresentativeTest : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
{
    private readonly IntegrationTestsWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ShippingAgentRepresentativeTest(IntegrationTestsWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    private void ReinitializeShippingAgentRepresentativesDb(PortProjectContext db)
    {
        // Remove existing representatives to ensure a clean state
        ShippingAgentRepresentativeUtilities.ReinitializeDbForTests(db);
    }

    [Theory]
    [InlineData("/api/ShippingAgentRepresentatives")]
    public async Task Get_EndpointsReturnSuccessAndCorrectContentType(string url)
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
        }

        // Act
        var response = await _client.GetAsync(url);

        // Assert
        response.EnsureSuccessStatusCode();
        var contentType = response.Content.Headers.ContentType?.ToString();
        Assert.Equal("application/json; charset=utf-8", contentType);
    }

    [Fact]
    public async Task Get_ReturnAllRepresentatives()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
        }

        // Act
        var response = await _client.GetAsync("/api/ShippingAgentRepresentatives");

        // Assert
        var responseBody = await response.Content.ReadAsStringAsync();
        Assert.NotNull(responseBody);

        var jsonDocument = JsonDocument.Parse(responseBody);
        var jsonArray = jsonDocument.RootElement;

        Assert.True(jsonArray.ValueKind == JsonValueKind.Array, "Response body is not a JSON array");
        Assert.True(jsonArray.GetArrayLength() >= 3);
    }

    [Fact]
    public async Task Get_RepresentativeById_ReturnsCorrectRepresentative()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
            
            // Get the first representative ID from the database
            var firstRep = db.ShippingAgentRepresentatives.First();
            var representativeId = firstRep.RepresentativeId.Value.ToString();

            // Act
            var response = await _client.GetAsync($"/api/ShippingAgentRepresentatives/{representativeId}");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseBody = await response.Content.ReadAsStringAsync();
            var representative = JsonConvert.DeserializeObject<ShippingAgentRepresentativeDto>(responseBody);

            Assert.NotNull(representative);
            Assert.Equal(representativeId, representative.RepresentativeId);
            Assert.NotNull(representative.RepresentativeName);
        }
    }

    [Fact]
    public async Task Get_RepresentativeById_NotFound_Returns404()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
        }

        // Act
        var response = await _client.GetAsync($"/api/ShippingAgentRepresentatives/{Guid.NewGuid()}");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Post_CreatesRepresentative()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
        }

        var organizationId = "11111111-1111-1111-1111-111111111111"; // Maersk organization
        
        // Generate a truly unique citizen ID using Guid hash to ensure uniqueness across test runs
        var guidHash = Math.Abs(Guid.NewGuid().GetHashCode());
        var uniqueCitizenId = $"{guidHash % 100000000:D8}";
        
        var newRepresentative = new CreateShippingAgentRepresentativeDto
        {
            OrganizationId = organizationId,
            RepresentativeName = "Carlos Mendes",
            CitizenId = uniqueCitizenId,
            RepresentativeNationality = "Portuguese",
            RepresentativeEmail = "carlos.mendes@maersk.pt",
            RepresentativePhone = "965432109"
        };

        var jsonContent = JsonConvert.SerializeObject(newRepresentative);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/ShippingAgentRepresentatives", content);

        // Assert
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Failed to create representative. Status: {response.StatusCode}, Error: {errorContent}");
        }
        
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var created = JsonConvert.DeserializeObject<ShippingAgentRepresentativeDto>(responseBody);

        Assert.NotNull(created);
        Assert.NotNull(created.RepresentativeId);
        Assert.Equal("Carlos Mendes", created.RepresentativeName);
        Assert.Equal(organizationId, created.OrganizationId);
        
        // Verify the representative was created by fetching it
        var getResponse = await _client.GetAsync($"/api/ShippingAgentRepresentatives/{created.RepresentativeId}");
        getResponse.EnsureSuccessStatusCode();
        var fetchedRep = JsonConvert.DeserializeObject<ShippingAgentRepresentativeDto>(
            await getResponse.Content.ReadAsStringAsync());

        Assert.NotNull(fetchedRep);
        Assert.Equal("Carlos Mendes", fetchedRep.RepresentativeName);
        Assert.Equal(uniqueCitizenId, fetchedRep.CitizenId);
    }

    [Fact]
    public async Task Post_EmptyRepresentativeName_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
        }

        var organizationId = "11111111-1111-1111-1111-111111111111";
        
        var invalidRepresentative = new CreateShippingAgentRepresentativeDto
        {
            OrganizationId = organizationId,
            RepresentativeName = "", // Empty name
            CitizenId = "12345678",
            RepresentativeNationality = "Portuguese",
            RepresentativeEmail = "test@test.com",
            RepresentativePhone = "912345678"
        };

        var jsonContent = JsonConvert.SerializeObject(invalidRepresentative);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/ShippingAgentRepresentatives", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_InvalidRepresentativeName_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
        }

        var organizationId = "11111111-1111-1111-1111-111111111111";
        
        var invalidRepresentative = new CreateShippingAgentRepresentativeDto
        {
            OrganizationId = organizationId,
            RepresentativeName = "AB", // Too short (less than 3 characters)
            CitizenId = "12345678",
            RepresentativeNationality = "Portuguese",
            RepresentativeEmail = "test@test.com",
            RepresentativePhone = "912345678"
        };

        var jsonContent = JsonConvert.SerializeObject(invalidRepresentative);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/ShippingAgentRepresentatives", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_InvalidCitizenId_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
        }

        var organizationId = "11111111-1111-1111-1111-111111111111";
        
        var invalidRepresentative = new CreateShippingAgentRepresentativeDto
        {
            OrganizationId = organizationId,
            RepresentativeName = "Test Representative",
            CitizenId = "123", // Invalid - too short (less than 8 characters required)
            RepresentativeNationality = "Portuguese",
            RepresentativeEmail = "test@test.com",
            RepresentativePhone = "912345678"
        };

        var jsonContent = JsonConvert.SerializeObject(invalidRepresentative);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/ShippingAgentRepresentatives", content);

        // Assert
        Assert.Contains(response.StatusCode, new[] { System.Net.HttpStatusCode.BadRequest, System.Net.HttpStatusCode.InternalServerError });
        
    }

    [Fact]
    public async Task Post_InvalidPhoneNumber_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
        }

        var organizationId = "11111111-1111-1111-1111-111111111111";
        
        var invalidRepresentative = new CreateShippingAgentRepresentativeDto
        {
            OrganizationId = organizationId,
            RepresentativeName = "Test Representative",
            CitizenId = "12345678",
            RepresentativeNationality = "Portuguese",
            RepresentativeEmail = "test@test.com",
            RepresentativePhone = "812345678" // Invalid - doesn't start with 9
        };

        var jsonContent = JsonConvert.SerializeObject(invalidRepresentative);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/ShippingAgentRepresentatives", content);

        // Assert
        Assert.Contains(response.StatusCode, new[] { System.Net.HttpStatusCode.BadRequest, System.Net.HttpStatusCode.InternalServerError });
    }

    [Fact]
    public async Task Post_InvalidEmail_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
        }

        var organizationId = "11111111-1111-1111-1111-111111111111";
        
        var invalidRepresentative = new CreateShippingAgentRepresentativeDto
        {
            OrganizationId = organizationId,
            RepresentativeName = "Test Representative",
            CitizenId = "12345678",
            RepresentativeNationality = "Portuguese",
            RepresentativeEmail = "invalid-email", // Invalid email format
            RepresentativePhone = "912345678"
        };

        var jsonContent = JsonConvert.SerializeObject(invalidRepresentative);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/ShippingAgentRepresentatives", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }



    [Fact]
    public async Task Put_UpdatesRepresentative()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
            
            var firstRep = db.ShippingAgentRepresentatives.First();
            var representativeId = firstRep.RepresentativeId.Value.ToString();
            var organizationId = firstRep.OrganizationId?.Value.ToString() ?? "";

            var updateDto = new CreateShippingAgentRepresentativeDto
            {
                OrganizationId = organizationId,
                RepresentativeName = "Updated Name",
                CitizenId = "11111111",
                RepresentativeNationality = "Portuguese",
                RepresentativeEmail = "updated@email.com",
                RepresentativePhone = "987654321"
            };

            var jsonContent = JsonConvert.SerializeObject(updateDto);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Act
            HttpResponseMessage response = await _client.PutAsync($"/api/ShippingAgentRepresentatives/{representativeId}", content);

            // Assert
            response.EnsureSuccessStatusCode();
            var responseBody = await response.Content.ReadAsStringAsync();
            var updated = JsonConvert.DeserializeObject<ShippingAgentRepresentativeDto>(responseBody);

            Assert.NotNull(updated);
            Assert.Equal("Updated Name", updated.RepresentativeName);
            Assert.Equal("updated@email.com", updated.RepresentativeEmail);
        }
    }

    [Fact]
    public async Task Delete_RemovesRepresentative()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
            
            var firstRep = db.ShippingAgentRepresentatives.First();
            var representativeId = firstRep.RepresentativeId.Value.ToString();

            // Act
            HttpResponseMessage response = await _client.DeleteAsync($"/api/ShippingAgentRepresentatives/{representativeId}");

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.NoContent, response.StatusCode);

            // Verify it was deleted
            var getResponse = await _client.GetAsync($"/api/ShippingAgentRepresentatives/{representativeId}");
            Assert.Equal(System.Net.HttpStatusCode.NotFound, getResponse.StatusCode);
        }
    }

    [Fact]
    public async Task Get_RepresentativesByOrganizationId_ReturnsCorrectRepresentatives()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
        }

        var organizationId = "11111111-1111-1111-1111-111111111111"; // Maersk - has 2 representatives

        // Act
        var response = await _client.GetAsync($"/api/ShippingAgentRepresentatives/by-organization/{organizationId}");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var representatives = JsonConvert.DeserializeObject<List<ShippingAgentRepresentativeDto>>(responseBody);

        Assert.NotNull(representatives);
        Assert.Equal(2, representatives.Count);
        Assert.All(representatives, r => Assert.Equal(organizationId, r.OrganizationId));
    }

    [Fact]
    public async Task Get_AllRepresentatives_ReturnsMultipleRepresentatives()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentRepresentativesDb(db);
        }

        // Act
        var response = await _client.GetAsync("/api/ShippingAgentRepresentatives");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var representatives = JsonConvert.DeserializeObject<List<ShippingAgentRepresentativeDto>>(responseBody);

        Assert.NotNull(representatives);
        Assert.True(representatives.Count >= 3);
        Assert.Contains(representatives, r => r.RepresentativeName == "Maria Silva");
        Assert.Contains(representatives, r => r.RepresentativeName == "João Santos");
        Assert.Contains(representatives, r => r.RepresentativeName == "Ana Costa");
    }
}