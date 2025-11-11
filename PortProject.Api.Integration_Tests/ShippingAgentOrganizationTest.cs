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

public class ShippingAgentOrganizationTest : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
{
    private readonly IntegrationTestsWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ShippingAgentOrganizationTest(IntegrationTestsWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    private void ReinitializeShippingAgentOrganizationsDb(PortProjectContext db)
    {
        // Remove existing organizations to ensure a clean state
        ShippingAgentOrganizationUtilities.ReinitializeDbForTests(db);
    }

    [Theory]
    [InlineData("/api/ShippingAgentOrganizations")]
    public async Task Get_EndpointsReturnSuccessAndCorrectContentType(string url)
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentOrganizationsDb(db);
        }

        // Act
        var response = await _client.GetAsync(url);

        // Assert
        response.EnsureSuccessStatusCode();
        var contentType = response.Content.Headers.ContentType?.ToString();
        Assert.Equal("application/json; charset=utf-8", contentType);
    }

    [Fact]
    public async Task Get_ReturnAllOrganizations()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentOrganizationsDb(db);
        }

        // Act
        var response = await _client.GetAsync("/api/ShippingAgentOrganizations");

        // Assert
        var responseBody = await response.Content.ReadAsStringAsync();
        Assert.NotNull(responseBody);

        var jsonDocument = JsonDocument.Parse(responseBody);
        var jsonArray = jsonDocument.RootElement;

        Assert.True(jsonArray.ValueKind == JsonValueKind.Array, "Response body is not a JSON array");
        Assert.True(jsonArray.GetArrayLength() >= 3);
    }

    [Fact]
    public async Task Get_OrganizationById_ReturnsCorrectOrganization()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentOrganizationsDb(db);
        }

        var organizationId = "11111111-1111-1111-1111-111111111111";

        // Act
        var response = await _client.GetAsync($"/api/ShippingAgentOrganizations/{organizationId}");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var organization = JsonConvert.DeserializeObject<ShippingAgentOrganizationDto>(responseBody);

        Assert.NotNull(organization);
        Assert.Equal("Maersk Line Portugal", organization.LegalName);
        Assert.Equal("123456789", organization.TaxNumber);
    }

    [Fact]
    public async Task Get_OrganizationById_NotFound_Returns404()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentOrganizationsDb(db);
        }

        // Act
        var response = await _client.GetAsync($"/api/ShippingAgentOrganizations/{Guid.NewGuid()}");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Post_CreatesOrganization()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentOrganizationsDb(db);
        }

        // Generate a truly unique valid tax number (9 digits, first digit 1-9)
        // Using Guid hash to ensure uniqueness across test runs
        var guidHash = Math.Abs(Guid.NewGuid().GetHashCode());
        var uniqueTaxNumber = $"{(guidHash % 9) + 1}{guidHash % 100000000:D8}";
        
        var newOrganization = new CreateShippingAgentOrganizationDto
        {
            LegalName = "New Shipping Company",
            AlternativeName = "NSC",
            Street = "New Street 123",
            City = "Faro",
            Country = "Portugal",
            TaxNumber = uniqueTaxNumber,
            Representatives = new List<CreateShippingAgentRepresentativeForOrganizationDto>
            {
                new CreateShippingAgentRepresentativeForOrganizationDto
                {
                    RepresentativeName = "John Smith",
                    CitizenId = "12345678",
                    RepresentativeNationality = "Portuguese",
                    RepresentativeEmail = "john.smith@newshipping.com",
                    RepresentativePhone = "912345678"
                }
            }
        };

        var jsonContent = JsonConvert.SerializeObject(newOrganization);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/ShippingAgentOrganizations", content);

        // Assert
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Failed to create organization. Status: {response.StatusCode}, Error: {errorContent}");
        }
        
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var createdId = JsonConvert.DeserializeObject<Guid>(responseBody);

        Assert.NotEqual(Guid.Empty, createdId);

        // Verify the organization was created
        var getResponse = await _client.GetAsync($"/api/ShippingAgentOrganizations/{createdId}");
        getResponse.EnsureSuccessStatusCode();
        var organization = JsonConvert.DeserializeObject<ShippingAgentOrganizationDto>(
            await getResponse.Content.ReadAsStringAsync());

        Assert.NotNull(organization);
        Assert.Equal("New Shipping Company", organization.LegalName);
        Assert.Equal(uniqueTaxNumber, organization.TaxNumber);
    }

    [Fact]
    public async Task Post_InvalidLegalName_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentOrganizationsDb(db);
        }

        var invalidOrganization = new CreateShippingAgentOrganizationDto
        {
            LegalName = "AB", // Too short (less than 3 characters)
            AlternativeName = "Test",
            Street = "Test Street",
            City = "Test City",
            Country = "Test Country",
            TaxNumber = "444555666", // Unique tax number
            Representatives = new List<CreateShippingAgentRepresentativeForOrganizationDto>
            {
                new CreateShippingAgentRepresentativeForOrganizationDto
                {
                    RepresentativeName = "Test Representative",
                    CitizenId = "12345678",
                    RepresentativeNationality = "Portuguese",
                    RepresentativeEmail = "test@test.com",
                    RepresentativePhone = "+351912345678"
                }
            }
        };

        var jsonContent = JsonConvert.SerializeObject(invalidOrganization);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/ShippingAgentOrganizations", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_EmptyLegalName_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentOrganizationsDb(db);
        }

        var invalidOrganization = new CreateShippingAgentOrganizationDto
        {
            LegalName = "",
            AlternativeName = "Test",
            Street = "Test Street",
            City = "Test City",
            Country = "Test Country",
            TaxNumber = "333444555", // Unique tax number
            Representatives = new List<CreateShippingAgentRepresentativeForOrganizationDto>
            {
                new CreateShippingAgentRepresentativeForOrganizationDto
                {
                    RepresentativeName = "Test Representative",
                    CitizenId = "12345678",
                    RepresentativeNationality = "Portuguese",
                    RepresentativeEmail = "test@test.com",
                    RepresentativePhone = "+351912345678"
                }
            }
        };

        var jsonContent = JsonConvert.SerializeObject(invalidOrganization);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/ShippingAgentOrganizations", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_InvalidTaxNumber_ReturnsBadRequest()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentOrganizationsDb(db);
        }

        var invalidOrganization = new CreateShippingAgentOrganizationDto
        {
            LegalName = "Test Company",
            AlternativeName = "Test",
            Street = "Test Street",
            City = "Test City",
            Country = "Test Country",
            TaxNumber = "INVALID", // Invalid tax number format
            Representatives = new List<CreateShippingAgentRepresentativeForOrganizationDto>
            {
                new CreateShippingAgentRepresentativeForOrganizationDto
                {
                    RepresentativeName = "Test Representative",
                    CitizenId = "12345678",
                    RepresentativeNationality = "Portuguese",
                    RepresentativeEmail = "test@test.com",
                    RepresentativePhone = "+351912345678"
                }
            }
        };

        var jsonContent = JsonConvert.SerializeObject(invalidOrganization);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/ShippingAgentOrganizations", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_DuplicateTaxNumber_ReturnsError()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentOrganizationsDb(db);
        }

        var duplicateOrganization = new CreateShippingAgentOrganizationDto
        {
            LegalName = "Duplicate Test Company",
            AlternativeName = "Duplicate Test",
            Street = "Test Street",
            City = "Test City",
            Country = "Test Country",
            TaxNumber = "123456789", // Same as existing organization from seed data
            Representatives = new List<CreateShippingAgentRepresentativeForOrganizationDto>
            {
                new CreateShippingAgentRepresentativeForOrganizationDto
                {
                    RepresentativeName = "Test Representative",
                    CitizenId = "12345678",
                    RepresentativeNationality = "Portuguese",
                    RepresentativeEmail = "test@test.com",
                    RepresentativePhone = "+351912345678"
                }
            }
        };

        var jsonContent = JsonConvert.SerializeObject(duplicateOrganization);
        var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        // Act
        HttpResponseMessage response = await _client.PostAsync("/api/ShippingAgentOrganizations", content);

        // Assert - Service throws InvalidOperationException which is not caught by controller, returns 500
        Assert.Equal(System.Net.HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task Get_AllOrganizations_ReturnsMultipleOrganizations()
    {
        // Arrange
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            ReinitializeShippingAgentOrganizationsDb(db);
        }

        // Act
        var response = await _client.GetAsync("/api/ShippingAgentOrganizations");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        var organizations = JsonConvert.DeserializeObject<List<ShippingAgentOrganizationDto>>(responseBody);

        Assert.NotNull(organizations);
        Assert.True(organizations.Count >= 3);
        Assert.Contains(organizations, o => o.LegalName == "Maersk Line Portugal");
        Assert.Contains(organizations, o => o.LegalName == "Mediterranean Shipping Company");
        Assert.Contains(organizations, o => o.LegalName == "CMA CGM Iberia");
    }
}