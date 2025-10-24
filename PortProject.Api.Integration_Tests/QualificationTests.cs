using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using PortProject.Api.Models;
using PortProject.Api.Domain.QualificationAggregate;
using PortProject.Api.Application.Qualifications.DTOs;
using PortProject.Api.Integration_Tests.Helpers;

namespace PortProject.Api.Integration_Tests;

public class QualificationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
{
    private readonly IntegrationTestsWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public QualificationTests(IntegrationTestsWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        SeedDatabase(); // Seed data needed for tests
    }

    // --- Database Seeding ---
    private void SeedDatabase()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();
            // Clean slate
            db.Qualifications.RemoveRange(db.Qualifications);
            db.SaveChanges();

            // Seed initial qualification
            var qual1 = new Qualification(new QualificationCode("SEED-Q1"), new QualificationName("Seeded Qual"), new QualificationDescription("Initial Desc"));
            db.Qualifications.Add(qual1);
            db.SaveChanges();
        }
    }

    // --- Helper to serialize ---
    private StringContent SerializeDto(object dto)
    {
        var json = JsonSerializer.Serialize(dto, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    // --- Tests ---

    [Fact]
    public async Task Post_CreateQualification_Returns201Created()
    {
        // Arrange
        var createDto = new CreateQualificationDto { Code = "NEW-Q1", Name = "New Qual", Description = "New Desc" };
        var content = SerializeDto(createDto);

        // Act
        var response = await _client.PostAsync("/api/Qualifications", content);

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);
        var responseBody = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseBody);
        Assert.Equal("NEW-Q1", jsonDoc.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Post_CreateQualification_DuplicateCode_Returns400BadRequest() // Or 500 if DB constraint fails
    {
        // Arrange
        var createDto = new CreateQualificationDto { Code = "SEED-Q1", Name = "Duplicate", Description = "Should fail" }; // Existing code
        var content = SerializeDto(createDto);

        // Act
        var response = await _client.PostAsync("/api/Qualifications", content);

        // Assert
        // Expecting DbUpdateException caught by generic handler -> 500,
        // or potentially a service-level check returning 400/409. Check controller handler.
        Assert.True(response.StatusCode == System.Net.HttpStatusCode.InternalServerError ||
                    response.StatusCode == System.Net.HttpStatusCode.BadRequest ||
                    response.StatusCode == System.Net.HttpStatusCode.Conflict,
                    $"Expected 400/409/500 but got {response.StatusCode}");
    }

    [Fact]
    public async Task GetByCode_ExistingQual_Returns200Ok()
    {
        // Arrange
        var code = "SEED-Q1";

        // Act
        var response = await _client.GetAsync($"/api/Qualifications/{code}");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseBody);
        Assert.Equal(code, jsonDoc.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task GetByCode_NonExistentQual_Returns404NotFound()
    {
        // Arrange
        var code = "NON-EXIST";

        // Act
        var response = await _client.GetAsync($"/api/Qualifications/{code}");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_ReturnsAllQualifications()
    {
        // Arrange & Act
        var response = await _client.GetAsync("/api/Qualifications");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseBody);
        Assert.True(jsonDoc.RootElement.GetArrayLength() >= 1);
    }

    [Fact]
    public async Task Put_UpdateQualification_Returns200Ok()
    {
        // Arrange
        var code = "SEED-Q1";
        var updateDto = new UpdateQualificationDto { Name = "Updated Name", Description = "Updated Desc" };
        var content = SerializeDto(updateDto);

        // Act
        var response = await _client.PutAsync($"/api/Qualifications/{code}", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseBody);
        Assert.Equal("Updated Name", jsonDoc.RootElement.GetProperty("name").GetString());
        Assert.Equal("Updated Desc", jsonDoc.RootElement.GetProperty("description").GetString());

        // Verify with GET
        var getResponse = await _client.GetAsync($"/api/Qualifications/{code}");
        var getBody = await getResponse.Content.ReadAsStringAsync();
        using var getJson = JsonDocument.Parse(getBody);
        Assert.Equal("Updated Name", getJson.RootElement.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Put_UpdateNonExistentQual_Returns404NotFound()
    {
        // Arrange
        var code = "NON-EXIST";
        var updateDto = new UpdateQualificationDto { Name = "Wont Update", Description = "" };
        var content = SerializeDto(updateDto);

        // Act
        var response = await _client.PutAsync($"/api/Qualifications/{code}", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }
}