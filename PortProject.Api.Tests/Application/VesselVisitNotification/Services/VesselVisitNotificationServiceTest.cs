using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.VesselVisitNotification.DTOs;
using PortProject.Api.Application.VesselVisitNotification.Services;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Domain.DockAggregate;
using PortProject.Api.Domain.StaffMemberAggregate;
using PortProject.Api.Models; // For PortProjectContext (mocked)
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PortProject.Api.Tests.Application.VesselVisitNotification.Services;

[TestClass]
public class VesselVisitNotificationServiceTests
{
    private Mock<IVesselVisitNotificationRepository> _mockRepo = null!;
    private Mock<PortProjectContext> _mockContext = null!; // Mock DbContext for SaveChangesAsync verification
    private VesselVisitNotificationService _service = null!;

    // Helper data
    private CreateVvnDto _validCreateDto = null!;
    private global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification _existingNotification = null!;
    private Guid _validNotificationIdGuid;
    private NotificationId _validNotificationId;
    private Guid _validRepresentativeIdGuid;
    private RepresentativeId _validRepresentativeId;
    private ImoNumber _validVesselImo;


    [TestInitialize]
    public void TestInitialize()
    {
        _mockRepo = new Mock<IVesselVisitNotificationRepository>();
        // Mock DbContext - essential for verifying SaveChangesAsync
        _mockContext = new Mock<PortProjectContext>();
        // Ensure SaveChangesAsync returns a successful result when called
        _mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        _service = new VesselVisitNotificationService(_mockRepo.Object, _mockContext.Object);

        // Setup valid IDs and DTOs
        _validNotificationIdGuid = Guid.NewGuid();
        _validNotificationId = new NotificationId(_validNotificationIdGuid);
        _validRepresentativeIdGuid = Guid.NewGuid();
        _validRepresentativeId = new RepresentativeId(_validRepresentativeIdGuid);
        _validVesselImo = new ImoNumber("9319466"); // Use valid IMO

        _validCreateDto = new CreateVvnDto
        {
            EstimatedArrival = DateTime.UtcNow.AddHours(1),
            EstimatedDeparture = DateTime.UtcNow.AddHours(10),
            VesselImo = _validVesselImo.Value,
            RepresentativeId = _validRepresentativeIdGuid.ToString(),
            Cargo = new CreateCargoDto
            {
                Description = "Test Cargo",
                Weight = 1000,
                Containers = new List<CreateContainerDto> { new CreateContainerDto { ContainerCode = "CSQU3054383", Position = "P1" } }
            },
            CrewMembers = new List<CreateCrewMemberDto> { new CreateCrewMemberDto { Name = "Crew1", Nationality = "TestNat" } }
        };

        // set an existing notification for update/submit tests
        _existingNotification = global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification.Create(
            new ETA(_validCreateDto.EstimatedArrival),
            new ETD(_validCreateDto.EstimatedDeparture),
            _validVesselImo,
            _validRepresentativeId,
            new Cargo(_validCreateDto.Cargo.Description, _validCreateDto.Cargo.Weight, _validCreateDto.Cargo.Containers.Select(c=> new Container(new ContainerCode(c.ContainerCode), c.Position)).ToList()),
            _validCreateDto.CrewMembers.Select(cm => new CrewMember(cm.Name, cm.Nationality)).ToList()
        );
        // Use reflection to set its ID for consistent testing
        SetPrivateField(_existingNotification, "Id", _validNotificationId);
    }

    // --- CreateAsync Tests ---

    [TestMethod]
    public async Task CreateAsync_WithValidData_ShouldCallRepoAddAndSaveChangesAndReturnDto()
    {
        // Arrange
        // (Setup in TestInitialize)

        // Act
        var resultDto = await _service.CreateAsync(_validCreateDto, _validRepresentativeIdGuid.ToString());

        // Assert
        Assert.IsNotNull(resultDto);
        Assert.AreEqual(_validCreateDto.VesselImo, resultDto.VesselImo);
        Assert.AreEqual(NotificationStatus.InProgress.ToString(), resultDto.Status);
        Assert.AreEqual(1, resultDto.CrewMembers.Count);

        _mockRepo.Verify(r => r.AddAsync(It.IsAny<global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification>()), Times.Once);
        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        // Verify AddRange was called for crew (if list was not empty)
        if (_validCreateDto.CrewMembers?.Any() ?? false)
        {
             _mockContext.Verify(c => c.AddRange(It.Is<IEnumerable<CrewMember>>(list => list.Count() == _validCreateDto.CrewMembers.Count)), Times.Once);
        }
    }

    [TestMethod]
    public async Task CreateAsync_WithInvalidRepresentativeIdFormat_ShouldThrowFormatException()
    {
        // Arrange
        var invalidRepId = "not-a-guid";

        // Act & Assert
        await Assert.ThrowsExceptionAsync<FormatException>(() =>
            _service.CreateAsync(_validCreateDto, invalidRepId)
        );
    }

     [TestMethod]
    public async Task CreateAsync_WithArrivalAfterDeparture_ShouldThrowArgumentException()
    {
        // Arrange
         var invalidDto = new CreateVvnDto
        {
            EstimatedArrival = DateTime.UtcNow.AddHours(10), // AFTER departure
            EstimatedDeparture = DateTime.UtcNow.AddHours(1),
            VesselImo = _validVesselImo.Value,
            RepresentativeId = _validRepresentativeIdGuid.ToString(),
            Cargo = _validCreateDto.Cargo
        };

        // Act & Assert
        await Assert.ThrowsExceptionAsync<ArgumentException>(() =>
            _service.CreateAsync(invalidDto, _validRepresentativeIdGuid.ToString())
        );
    }

    // --- UpdateAsync Tests ---

    [TestMethod]
    public async Task UpdateAsync_WhenNotificationExistsAndInProgress_ShouldUpdateAndSaveChanges()
    {
        // Arrange
        // Ensure the mock returns the notification in the correct state
        SetPrivateField(_existingNotification, "Status", NotificationStatus.InProgress);
        _mockRepo.Setup(r => r.GetByIdAsync(_validNotificationId)).Returns(Task.FromResult<global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification?>(_existingNotification));

        var updateDto = new CreateVvnDto // Use Create DTO as update source
        {
             EstimatedArrival = _validCreateDto.EstimatedArrival.AddMinutes(30), // Changed
             EstimatedDeparture = _validCreateDto.EstimatedDeparture.AddMinutes(30), // Changed
             VesselImo = _validCreateDto.VesselImo,
             RepresentativeId = _validCreateDto.RepresentativeId, // Included in DTO
             Cargo = new CreateCargoDto { Description = "Updated Cargo", Weight = 1500, Containers = new List<CreateContainerDto>() }, // Changed
             CrewMembers = new List<CreateCrewMemberDto>() // Changed (empty list)
        };

        // Act
        var resultDto = await _service.UpdateAsync(_validNotificationIdGuid.ToString(), updateDto);

        // Assert
        Assert.IsNotNull(resultDto);
        Assert.AreEqual("Updated Cargo", resultDto.Cargo.Description);
        Assert.AreEqual(0, resultDto.CrewMembers.Count);
        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once); // Verify save
    }

    [TestMethod]
    public async Task UpdateAsync_WhenNotificationNotFound_ShouldThrowKeyNotFoundException()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<NotificationId>())).Returns(Task.FromResult<global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification?>(null));
        var updateDto = _validCreateDto; // Content doesn't matter here

        // Act & Assert
        await Assert.ThrowsExceptionAsync<KeyNotFoundException>(() =>
            _service.UpdateAsync(_validNotificationIdGuid.ToString(), updateDto)
        );
    }

    [TestMethod]
    public async Task UpdateAsync_WhenStatusNotInProgressOrRejected_ShouldThrowInvalidOperationException()
    {
        // Arrange
        SetPrivateField(_existingNotification, "Status", NotificationStatus.Submitted); // Set to Submitted
        _mockRepo.Setup(r => r.GetByIdAsync(_validNotificationId)).Returns(Task.FromResult<global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification?>(_existingNotification));
        var updateDto = _validCreateDto; // Content doesn't matter

        // Act & Assert
        // The service should catch the exception from the domain object's UpdateDetails method
        await Assert.ThrowsExceptionAsync<InvalidOperationException>(() =>
             _service.UpdateAsync(_validNotificationIdGuid.ToString(), updateDto)
         );
    }


    // --- SubmitAsync Tests ---
    [TestMethod]
    public async Task SubmitAsync_WhenInProgress_ShouldCallSubmitAndSaveChanges()
    {
        // Arrange
        SetPrivateField(_existingNotification, "Status", NotificationStatus.InProgress);
        _mockRepo.Setup(r => r.GetByIdAsync(_validNotificationId)).Returns(Task.FromResult<global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification?>(_existingNotification));

        // Act
        await _service.SubmitAsync(_validNotificationIdGuid.ToString());

        // Assert
        Assert.AreEqual(NotificationStatus.Submitted, _existingNotification.Status); // Check domain object state change
        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [TestMethod]
    public async Task SubmitAsync_WhenNotFound_ShouldThrowKeyNotFoundException()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<NotificationId>())).Returns(Task.FromResult<global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification?>(null));

        // Act & Assert
        await Assert.ThrowsExceptionAsync<KeyNotFoundException>(() =>
            _service.SubmitAsync(_validNotificationIdGuid.ToString())
        );
    }

     [TestMethod]
    public async Task SubmitAsync_WhenStatusNotInProgress_ShouldThrowInvalidOperationException()
    {
        // Arrange
        SetPrivateField(_existingNotification, "Status", NotificationStatus.Submitted); // Already submitted
        _mockRepo.Setup(r => r.GetByIdAsync(_validNotificationId)).Returns(Task.FromResult<global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification?>(_existingNotification));

        // Act & Assert
        await Assert.ThrowsExceptionAsync<InvalidOperationException>(() =>
            _service.SubmitAsync(_validNotificationIdGuid.ToString())
        );
    }

    // --- GetByIdAsync Tests ---
    [TestMethod]
    public async Task GetByIdAsync_WhenFound_ShouldReturnMappedDto()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByIdAsync(_validNotificationId)).Returns(Task.FromResult<global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification?>(_existingNotification));

        // Act
        var result = await _service.GetByIdAsync(_validNotificationIdGuid.ToString());

        // Assert
        Assert.IsNotNull(result);
        Assert.AreEqual(_validNotificationIdGuid, result.Id);
        Assert.AreEqual(_existingNotification.VesselId.Value, result.VesselImo);
    }

     [TestMethod]
    public async Task GetByIdAsync_WhenNotFound_ShouldReturnNull()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByIdAsync(It.IsAny<NotificationId>())).Returns(Task.FromResult<global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification?>(null));

        // Act
        var result = await _service.GetByIdAsync(_validNotificationIdGuid.ToString());

        // Assert
        Assert.IsNull(result);
    }

     [TestMethod]
    public async Task GetByIdAsync_WithInvalidGuidFormat_ShouldThrowFormatException()
    {
        // Arrange
        var invalidId = "not-a-guid";

        // Act & Assert
        // The service GetByIdAsync should handle Guid.Parse throwing FormatException
         await Assert.ThrowsExceptionAsync<FormatException>(() =>
             _service.GetByIdAsync(invalidId)
         );
    }


    // Helper to set private fields via reflection
     private static void SetPrivateField(object obj, string fieldName, object value)
    {
        var field = obj.GetType().GetField(fieldName, System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public);
        if (field == null && !fieldName.StartsWith("_")) // Try property if field not found
        {
            var prop = obj.GetType().GetProperty(fieldName, System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public);
            if(prop != null && prop.CanWrite) {
                 prop.SetValue(obj, value);
                 return;
            } else if (prop != null && !prop.CanWrite) { // Try backing field for property
                 field = obj.GetType().GetField($"<{prop.Name}>k__BackingField", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            }
        }
         if (field == null && fieldName.StartsWith("_")) // Try backing field convention if explicitly asked
        {
             field = obj.GetType().GetField($"<{GetPropertyName(fieldName)}>k__BackingField", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public);
        }

        if (field == null) throw new ArgumentException($"Field or writable property '{fieldName}' not found in type '{obj.GetType().Name}'.");

        field.SetValue(obj, value);
    }
     private static string GetPropertyName(string fieldName) => char.ToUpperInvariant(fieldName[1]) + fieldName.Substring(2);
}