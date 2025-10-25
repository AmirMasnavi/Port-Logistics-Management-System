using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using PortProject.Api.Models; // For PortProjectContext
using PortProject.Api.Domain.QualificationAggregate; // For Qualification
using PortProject.Api.Domain.StaffMemberAggregate; // For StaffStatus
using PortProject.Api.Application.StaffMembers.DTOs; // For DTOs
using PortProject.Api.Integration_Tests.Helpers; // Assuming your factory is here

namespace PortProject.Api.Integration_Tests;

public class StaffMemberTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
{
    private readonly IntegrationTestsWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    // Static variables for seeded data
    private static bool _seeded = false;
    private static string _seededQualificationCode1 = "TEST-Q1";
    private static string _seededQualificationCode2 = "TEST-Q2";

    public StaffMemberTests(IntegrationTestsWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        SeedDatabaseIfNeeded();
    }

    // --- Database Seeding ---
    private void SeedDatabaseIfNeeded()
    {
        if (_seeded) return;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();

            // Clean slate
            db.StaffMembers.RemoveRange(db.StaffMembers);
            db.Qualifications.RemoveRange(db.Qualifications); // Need qualifications for tests
            db.SaveChanges();

            // Seed Qualifications needed for staff
            var qual1 = new Qualification(new QualificationCode(_seededQualificationCode1), new QualificationName("Test Qual 1"), new QualificationDescription("Desc 1"));
            var qual2 = new Qualification(new QualificationCode(_seededQualificationCode2), new QualificationName("Test Qual 2"), new QualificationDescription("Desc 2"));
            db.Qualifications.AddRange(qual1, qual2);

            // Seed Staff Members
            var staff1 = new StaffMember(new MecanographicNumber("SM001"), "John Doe", new ContactDetails("john@test.com", "911111111"), new OperationalWindow(new TimeOnly(8, 0), new TimeOnly(16, 0)));
            staff1.AddQualification(qual1); // Add qual1 to staff1

            var staff2 = new StaffMember(new MecanographicNumber("SM002"), "Jane Smith", new ContactDetails("jane@test.com", "922222222"), new OperationalWindow(new TimeOnly(9, 0), new TimeOnly(17, 0)));
            staff2.AddQualification(qual1); // Add qual1 to staff2
            staff2.AddQualification(qual2); // Add qual2 to staff2
            staff2.UpdateStatus(StaffStatus.Unavailable); // Make Jane unavailable

            db.StaffMembers.AddRange(staff1, staff2);
            db.SaveChanges();
            _seeded = true;
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
    public async Task Post_CreateStaffMember_Returns201Created()
    {
        // Arrange
        var createDto = new CreateStaffMemberDto
        {
            MecanographicNumber = "SM003",
            ShortName = "New Staff",
            Email = "new@test.com",
            Phone = "933333333",
            StartTime = new TimeOnly(10, 0),
            EndTime = new TimeOnly(18, 0)
            // No qualifications on create via this DTO
        };
        var content = SerializeDto(createDto);

        // Act
        var response = await _client.PostAsync("/api/StaffMembers", content);

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);

        var responseBody = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseBody);
        Assert.Equal("SM003", jsonDoc.RootElement.GetProperty("mecanographicNumber").GetString());
        Assert.Equal("Available", jsonDoc.RootElement.GetProperty("currentStatus").GetString());
    }

    [Fact]
    public async Task Post_CreateStaffMember_DuplicateId_Returns400BadRequest()
    {
        // Arrange
        var createDto = new CreateStaffMemberDto { MecanographicNumber = "SM001", /* other valid fields */ };
        var content = SerializeDto(createDto);

        // Act
        var response = await _client.PostAsync("/api/StaffMembers", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode); // Or Conflict 409 depending on service logic
    }
    [Fact]
    public async Task GetById_NonExistentStaff_Returns404NotFound()
    {
        // Arrange
        var id = "SM999";

        // Act
        var response = await _client.GetAsync($"/api/StaffMembers/{id}");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_NoFilter_ReturnsAllStaff()
    {
        // Arrange & Act
        var response = await _client.GetAsync("/api/StaffMembers");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseBody);
        Assert.True(jsonDoc.RootElement.GetArrayLength() >= 2);
    }

    [Fact]
    public async Task GetAll_FilterByStatus_ReturnsMatchingStaff()
    {
        // Arrange & Act
        var response = await _client.GetAsync("/api/StaffMembers?status=Unavailable");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseBody);
        Assert.Equal(1, jsonDoc.RootElement.GetArrayLength());
        Assert.Equal("SM002", jsonDoc.RootElement[0].GetProperty("mecanographicNumber").GetString());
    }

    [Fact]
    public async Task GetAll_FilterByQualification_ReturnsMatchingStaff()
    {
        // Arrange & Act
        var response = await _client.GetAsync($"/api/StaffMembers?qualificationCode={_seededQualificationCode2}");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseBody);
        Assert.Equal(1, jsonDoc.RootElement.GetArrayLength());
        Assert.Equal("SM002", jsonDoc.RootElement[0].GetProperty("mecanographicNumber").GetString());
    }

     [Fact]
    public async Task GetAll_FilterByMultiple_ReturnsMatchingStaff()
    {
        // Arrange & Act
        // Find Available staff with TEST-Q1
        var response = await _client.GetAsync($"/api/StaffMembers?status=Available&qualificationCode={_seededQualificationCode1}");

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseBody);
        Assert.Equal(1, jsonDoc.RootElement.GetArrayLength());
        Assert.Equal("SM001", jsonDoc.RootElement[0].GetProperty("mecanographicNumber").GetString());
    }


    [Fact]
    public async Task PatchStatus_UpdateStatus_Returns200Ok()
    {
        // Arrange
        var id = "SM001"; // Initially Available
        var updateDto = new UpdateStaffStatusDto { NewStatus = StaffStatus.Unavailable };
        var content = SerializeDto(updateDto);

        // Act
        var response = await _client.PatchAsync($"/api/StaffMembers/{id}/status", content);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseBody);
        Assert.Equal("Unavailable", jsonDoc.RootElement.GetProperty("currentStatus").GetString());

        // Verify with a GET request
        var getResponse = await _client.GetAsync($"/api/StaffMembers/{id}");
        var getBody = await getResponse.Content.ReadAsStringAsync();
        using var getJson = JsonDocument.Parse(getBody);
        Assert.Equal("Unavailable", getJson.RootElement.GetProperty("currentStatus").GetString());
    }

    [Fact]
    public async Task PatchStatus_NonExistentStaff_Returns404NotFound()
    {
        // Arrange
        var id = "SM999";
        var updateDto = new UpdateStaffStatusDto { NewStatus = StaffStatus.Unavailable };
        var content = SerializeDto(updateDto);

        // Act
        var response = await _client.PatchAsync($"/api/StaffMembers/{id}/status", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }
}