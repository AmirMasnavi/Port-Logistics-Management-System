using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using PortProject.Api.Models; // For PortProjectContext
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using PortProject.Api.Application.VesselVisitNotification.DTOs;
using PortProject.Api.Integration_Tests.Helpers; // Assuming your factory is here

namespace PortProject.Api.Integration_Tests;

public class VesselVisitNotificationTests : IClassFixture<IntegrationTestsWebApplicationFactory<Program>>
{
    private readonly IntegrationTestsWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public VesselVisitNotificationTests(IntegrationTestsWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
    }

    // --- Database Seeding Helper ---
    private (string vesselImo, string representativeId) SeedTestData()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PortProjectContext>();

            // Clean related tables first - remove notifications, then representatives, then organizations
            db.VesselVisitNotifications.RemoveRange(db.VesselVisitNotifications);
            db.ShippingAgentRepresentatives.RemoveRange(db.ShippingAgentRepresentatives);
            db.ShippingAgentOrganizations.RemoveRange(db.ShippingAgentOrganizations);
            db.SaveChanges();
            
            // Use the standard VesselTypeUtilities to seed vessel types
            VesselTypeUtilities.ReinitializeDbForTests(db);

            // Seed Vessel using one of the standard vessel type IDs
            var vessel = Vessel.Create("1234567", "Integration Test Vessel", "1001", "Integration Op"); // Using standard vessel type "1001"
            db.Vessels.Add(vessel);
            var seededVesselImo = vessel.ImoNumber.Value;

            // Seed Organization
            var org = new ShippingAgentOrganization(
                OrganizationId.NewId(),
                new LegalName("Integration Org"),
                new AlternativeName("IOM"),
                new Address("1 Int St", "Int City", "Int Country"),
                new TaxNumber("PT500111222") // Valid NIF
            );
            db.ShippingAgentOrganizations.Add(org);
            db.SaveChanges(); // Save org first to get its ID

            // Seed Representative linked to Org
            var rep = new ShippingAgentRepresentative(
                 new CitizenId("98765432Z"), // Valid CC
                 new RepresentativeName("Integration Rep"),
                 new RepresentativePhone("961111111"), // Valid PT mobile
                 new RepresentativeNationality("IntNation"),
                 new RepresentativeEmail("int.rep@org.com")
            );
            rep.AttachToOrganization(org.Id!);
            db.ShippingAgentRepresentatives.Add(rep);
            var seededRepresentativeId = rep.RepresentativeId.Value.ToString();

            db.SaveChanges();
            
            return (seededVesselImo, seededRepresentativeId);
        }
    }

    // --- Helper to serialize using System.Text.Json ---
    private StringContent SerializeDto(object dto)
    {
        var json = JsonSerializer.Serialize(dto, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    // --- Test Methods ---

    [Fact]
    public async Task Post_CreateNotification_WithValidData_Returns201Created()
    {
        // Arrange
        var (vesselImo, representativeId) = SeedTestData();
        
        var createDto = new CreateVvnDto
        {
            EstimatedArrival = DateTime.UtcNow.AddHours(2),
            EstimatedDeparture = DateTime.UtcNow.AddHours(12),
            VesselImo = vesselImo,
            RepresentativeId = representativeId,
            Cargo = new CreateCargoDto { Description = "Test", Weight = 100, Containers = new List<CreateContainerDto>{ new CreateContainerDto { ContainerCode="CSQU3054383", Position="B1"} } },
            CrewMembers = new List<CreateCrewMemberDto>{ new CreateCrewMemberDto { Name="Crew A", Nationality="N1"} }
        };
        var content = SerializeDto(createDto);

        // Act
        var response = await _client.PostAsync("/api/notifications", content);

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);

        var responseBody = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseBody);
        Assert.Equal("InProgress", jsonDoc.RootElement.GetProperty("status").GetString());
        Assert.Equal(vesselImo, jsonDoc.RootElement.GetProperty("vesselImo").GetString());
        Assert.Equal(representativeId, jsonDoc.RootElement.GetProperty("submittedBy").GetString(), ignoreCase: true);
        Assert.True(jsonDoc.RootElement.GetProperty("crewMembers").GetArrayLength() > 0);
        Assert.NotEmpty(jsonDoc.RootElement.GetProperty("id").GetString()!); // Ensure an ID was generated
    }

    [Fact]
    public async Task Post_CreateNotification_InvalidContainerCode_Returns400BadRequest()
    {
        // Arrange
        var (vesselImo, representativeId) = SeedTestData();
        
        var createDto = new CreateVvnDto
        {
            EstimatedArrival = DateTime.UtcNow.AddHours(2),
            EstimatedDeparture = DateTime.UtcNow.AddHours(12),
            VesselImo = vesselImo,
            RepresentativeId = representativeId,
            Cargo = new CreateCargoDto { Description = "Bad Container", Weight = 100, Containers = new List<CreateContainerDto>{ new CreateContainerDto { ContainerCode = "INVALID", Position = "B1"} } } // Invalid code
        };
        var content = SerializeDto(createDto);

        // Act
        var response = await _client.PostAsync("/api/notifications", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
    }

     [Fact]
    public async Task Post_CreateNotification_MissingRepresentative_Returns400BadRequest()
    {
        // Arrange
        var (vesselImo, _) = SeedTestData();
        var nonExistentRepId = Guid.NewGuid().ToString();
        
        var createDto = new CreateVvnDto
        {
            EstimatedArrival = DateTime.UtcNow.AddHours(2),
            EstimatedDeparture = DateTime.UtcNow.AddHours(12),
            VesselImo = vesselImo,
            RepresentativeId = nonExistentRepId, // This Rep ID doesn't exist
            Cargo = new CreateCargoDto { Description = "No Rep", Weight = 100, Containers = new List<CreateContainerDto>() }
        };
        var content = SerializeDto(createDto);

        // Act
        var response = await _client.PostAsync("/api/notifications", content);

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
        var responseString = await response.Content.ReadAsStringAsync();
        Assert.Contains("Foreign key constraint failed", responseString, StringComparison.OrdinalIgnoreCase);
    }


    [Fact]
    public async Task GetById_ExistingNotification_Returns200OkWithDetails()
    {
        // Arrange: Create a notification first
        var (vesselImo, representativeId) = SeedTestData();
        
        var createDto = new CreateVvnDto {
             EstimatedArrival = DateTime.UtcNow.AddHours(3), EstimatedDeparture = DateTime.UtcNow.AddHours(13),
             VesselImo = vesselImo, RepresentativeId = representativeId,
             Cargo = new CreateCargoDto { Description="GetTest", Weight=1, Containers=new List<CreateContainerDto>{new CreateContainerDto{ContainerCode="CSQU3054383", Position="G1"}}},
             CrewMembers = new List<CreateCrewMemberDto>{ new CreateCrewMemberDto{Name="GetCrew", Nationality="GetNat"}}
        };
        var createContent = SerializeDto(createDto);
        var createResponse = await _client.PostAsync("/api/notifications", createContent);
        createResponse.EnsureSuccessStatusCode();
        var createdDto = JsonSerializer.Deserialize<VesselVisitNotificationDto>(await createResponse.Content.ReadAsStringAsync(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        var notificationId = createdDto!.Id;

        // Act
        var response = await _client.GetAsync($"/api/notifications/{notificationId}");

        // Assert
        response.EnsureSuccessStatusCode(); // Status 200 OK
        var responseBody = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseBody);
        Assert.Equal(notificationId.ToString(), jsonDoc.RootElement.GetProperty("id").GetString(), ignoreCase: true);
        Assert.Equal("GetTest", jsonDoc.RootElement.GetProperty("cargo").GetProperty("description").GetString());
        Assert.True(jsonDoc.RootElement.GetProperty("crewMembers").GetArrayLength() > 0);
        Assert.Equal("GetCrew", jsonDoc.RootElement.GetProperty("crewMembers")[0].GetProperty("name").GetString());
    }

    [Fact]
    public async Task GetById_NonExistentNotification_Returns404NotFound()
    {
        // Arrange
        SeedTestData(); // Still need to initialize DB even if we don't use the data
        var nonExistentId = Guid.NewGuid().ToString();

        // Act
        var response = await _client.GetAsync($"/api/notifications/{nonExistentId}");

        // Assert
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_UpdateInProgressNotification_Returns200Ok()
    {
        // Arrange: Create a notification first
        var (vesselImo, representativeId) = SeedTestData();
        
        var createDto = new CreateVvnDto 
        { 
            EstimatedArrival = DateTime.UtcNow.AddHours(2),
            EstimatedDeparture = DateTime.UtcNow.AddHours(12),
            VesselImo = vesselImo,
            RepresentativeId = representativeId,
            Cargo = new CreateCargoDto { Description = "Original Cargo", Weight = 100, Containers = new List<CreateContainerDto>{ new CreateContainerDto { ContainerCode="CSQU3054383", Position="A1"} } },
            CrewMembers = new List<CreateCrewMemberDto>{ new CreateCrewMemberDto { Name="Original Crew", Nationality="OrigNat"} }
        };
        var createContent = SerializeDto(createDto);
        var createResponse = await _client.PostAsync("/api/notifications", createContent);
        createResponse.EnsureSuccessStatusCode();
        var createdDto = JsonSerializer.Deserialize<VesselVisitNotificationDto>(await createResponse.Content.ReadAsStringAsync(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        var notificationId = createdDto!.Id.ToString();

        // Arrange Update DTO
        var updateDto = new CreateVvnDto // Use Create DTO for update
        {
             EstimatedArrival = DateTime.UtcNow.AddHours(4), // Updated
             EstimatedDeparture = DateTime.UtcNow.AddHours(14), // Updated
             VesselImo = vesselImo,
             RepresentativeId = representativeId, // Must include RepId in PUT DTO
             Cargo = new CreateCargoDto { Description = "Updated PUT Cargo", Weight = 200, Containers = new List<CreateContainerDto>() }, // Updated
             CrewMembers = new List<CreateCrewMemberDto>{ new CreateCrewMemberDto { Name="Updated Crew", Nationality="UpNat"} } // Updated
        };
        var updateContent = SerializeDto(updateDto);

        // Act
        var response = await _client.PutAsync($"/api/notifications/{notificationId}", updateContent);

        // Assert
        response.EnsureSuccessStatusCode();
        var responseBody = await response.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(responseBody);
        Assert.Equal("Updated PUT Cargo", jsonDoc.RootElement.GetProperty("cargo").GetProperty("description").GetString());
        Assert.Equal("Updated Crew", jsonDoc.RootElement.GetProperty("crewMembers")[0].GetProperty("name").GetString());
    }

    [Fact]
    public async Task Put_UpdateSubmittedNotification_ReturnsError() // Should be 400 or 409
    {
        // Arrange: Create and SUBMIT a notification
        var (vesselImo, representativeId) = SeedTestData();
        
        var createDto = new CreateVvnDto 
        { 
            EstimatedArrival = DateTime.UtcNow.AddHours(2),
            EstimatedDeparture = DateTime.UtcNow.AddHours(12),
            VesselImo = vesselImo,
            RepresentativeId = representativeId,
            Cargo = new CreateCargoDto { Description = "Submit Test Cargo", Weight = 100, Containers = new List<CreateContainerDto>{ new CreateContainerDto { ContainerCode="CSQU3054383", Position="S1"} } },
            CrewMembers = new List<CreateCrewMemberDto>{ new CreateCrewMemberDto { Name="Submit Crew", Nationality="SubNat"} }
        };
        var createContent = SerializeDto(createDto);
        var createResponse = await _client.PostAsync("/api/notifications", createContent);
        createResponse.EnsureSuccessStatusCode();
        var createdDto = JsonSerializer.Deserialize<VesselVisitNotificationDto>(await createResponse.Content.ReadAsStringAsync(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        var notificationId = createdDto!.Id.ToString();
        // Submit it
        await _client.PatchAsync($"/api/notifications/{notificationId}/submit", null);

        // Arrange Update DTO
        var updateDto = new CreateVvnDto 
        { 
            EstimatedArrival = DateTime.UtcNow.AddHours(3),
            EstimatedDeparture = DateTime.UtcNow.AddHours(13),
            VesselImo = vesselImo,
            RepresentativeId = representativeId,
            Cargo = new CreateCargoDto { Description = "Updated Cargo", Weight = 150, Containers = new List<CreateContainerDto>() },
            CrewMembers = new List<CreateCrewMemberDto>{ new CreateCrewMemberDto { Name="Updated Crew", Nationality="UpdNat"} }
        };
        var updateContent = SerializeDto(updateDto);

        // Act
        var response = await _client.PutAsync($"/api/notifications/{notificationId}", updateContent);

        // Assert
        Assert.True(response.StatusCode == System.Net.HttpStatusCode.BadRequest || response.StatusCode == System.Net.HttpStatusCode.Conflict, $"Expected 400/409 but got {response.StatusCode}");
    }


    [Fact]
    public async Task PatchSubmit_InProgressNotification_ReturnsNoContent()
    {
        // Arrange: Create a notification
        var (vesselImo, representativeId) = SeedTestData();
        
        var createDto = new CreateVvnDto 
        { 
            EstimatedArrival = DateTime.UtcNow.AddHours(2),
            EstimatedDeparture = DateTime.UtcNow.AddHours(12),
            VesselImo = vesselImo,
            RepresentativeId = representativeId,
            Cargo = new CreateCargoDto { Description = "Patch Test Cargo", Weight = 100, Containers = new List<CreateContainerDto>{ new CreateContainerDto { ContainerCode="CSQU3054383", Position="P1"} } },
            CrewMembers = new List<CreateCrewMemberDto>{ new CreateCrewMemberDto { Name="Patch Crew", Nationality="PatchNat"} }
        };
        var createContent = SerializeDto(createDto);
        var createResponse = await _client.PostAsync("/api/notifications", createContent);
        createResponse.EnsureSuccessStatusCode();
        var createdDto = JsonSerializer.Deserialize<VesselVisitNotificationDto>(await createResponse.Content.ReadAsStringAsync(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        var notificationId = createdDto!.Id.ToString();

        // Act
        var response = await _client.PatchAsync($"/api/notifications/{notificationId}/submit", null); // No body needed

        // Assert
        response.EnsureSuccessStatusCode(); // Expect 2xx range
        Assert.Equal(System.Net.HttpStatusCode.NoContent, response.StatusCode);

        // Verify status changed using GET
        var getResponse = await _client.GetAsync($"/api/notifications/{notificationId}");
        getResponse.EnsureSuccessStatusCode();
        var getBody = await getResponse.Content.ReadAsStringAsync();
        using var jsonDoc = JsonDocument.Parse(getBody);
        Assert.Equal("Submitted", jsonDoc.RootElement.GetProperty("status").GetString());
    }

     [Fact]
    public async Task PatchSubmit_AlreadySubmittedNotification_ReturnsError() // Should be 400 or 409
    {
        // Arrange: Create and SUBMIT a notification
        var (vesselImo, representativeId) = SeedTestData();
        
        var createDto = new CreateVvnDto 
        { 
            EstimatedArrival = DateTime.UtcNow.AddHours(2),
            EstimatedDeparture = DateTime.UtcNow.AddHours(12),
            VesselImo = vesselImo,
            RepresentativeId = representativeId,
            Cargo = new CreateCargoDto { Description = "Double Submit Cargo", Weight = 100, Containers = new List<CreateContainerDto>{ new CreateContainerDto { ContainerCode="CSQU3054383", Position="D1"} } },
            CrewMembers = new List<CreateCrewMemberDto>{ new CreateCrewMemberDto { Name="Double Crew", Nationality="DblNat"} }
        };
        var createContent = SerializeDto(createDto);
        var createResponse = await _client.PostAsync("/api/notifications", createContent);
        createResponse.EnsureSuccessStatusCode();
        var createdDto = JsonSerializer.Deserialize<VesselVisitNotificationDto>(await createResponse.Content.ReadAsStringAsync(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        var notificationId = createdDto!.Id.ToString();
        // Submit it once
        await _client.PatchAsync($"/api/notifications/{notificationId}/submit", null);

        // Act: Try to submit again
        var response = await _client.PatchAsync($"/api/notifications/{notificationId}/submit", null);

        // Assert
        Assert.True(response.StatusCode == System.Net.HttpStatusCode.BadRequest || response.StatusCode == System.Net.HttpStatusCode.Conflict, $"Expected 400/409 but got {response.StatusCode}");
    }

    // Add tests for Approve, Reject, Resubmit following similar patterns
}