// using Microsoft.VisualStudio.TestTools.UnitTesting;
// using Moq;
// using PortProject.Api.Application.VesselVisitNotification.DTOs;
// using PortProject.Api.Application.VesselVisitNotification.Services;
// using PortProject.Api.Domain.VesselVisitNotificationAggregate;
// using PortProject.Api.Domain.VesselAggregate;
// using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
// using PortProject.Api.Domain.StaffMemberAggregate;
// using PortProject.Api.Models;
// using Microsoft.EntityFrameworkCore;
// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading;
// using System.Threading.Tasks;
//
// namespace PortProject.Api.Tests.Application.VesselVisitNotification.Services;
//
// [TestClass]
// public class VesselVisitNotificationServiceTests
// {
//     private Mock<IVesselVisitNotificationRepository> _mockRepo = null!;
//     private Mock<IShippingAgentRepresentativeRepository> _mockRepRepo = null!;
//     private Mock<PortProjectContext> _mockContext = null!;
//     private VesselVisitNotificationService _service = null!;
//
//     // Helper data
//     private CreateVvnDto _validCreateDto = null!;
//     private global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification _existingNotification = null!;
//     private string _validNotificationBusinessId = null!;
//     private Guid _validRepresentativeIdGuid;
//     private RepresentativeId _validRepresentativeId;
//     private ImoNumber _validVesselImo;
//     private ShippingAgentRepresentative _validRepresentative = null!;
//
//
//     [TestInitialize]
//     public void TestInitialize()
//     {
//         _mockRepo = new Mock<IVesselVisitNotificationRepository>();
//         _mockRepRepo = new Mock<IShippingAgentRepresentativeRepository>();
//         _mockContext = new Mock<PortProjectContext>();
//         _mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
//
//         _service = new VesselVisitNotificationService(_mockRepo.Object, _mockContext.Object, _mockRepRepo.Object);
//
//         // Setup valid IDs and DTOs
//         _validNotificationBusinessId = "VVN-" + DateTime.UtcNow.Ticks;
//         _validRepresentativeIdGuid = Guid.NewGuid();
//         _validRepresentativeId = new RepresentativeId(_validRepresentativeIdGuid);
//         _validVesselImo = new ImoNumber("9319466");
//
//         _validCreateDto = new CreateVvnDto
//         {
//             EstimatedArrival = DateTime.UtcNow.AddHours(1),
//             EstimatedDeparture = DateTime.UtcNow.AddHours(10),
//             VesselImo = _validVesselImo.Value,
//             RepresentativeCitizenId = "12345678Z", // Use CitizenId instead of GUID
//             Cargo = new CreateCargoDto
//             {
//                 Description = "Test Cargo",
//                 Weight = 1000,
//                 Containers = new List<CreateContainerDto> { new CreateContainerDto { ContainerCode = "CSQU3054383", Position = "P1" } }
//             },
//             CrewMembers = new List<CreateCrewMemberDto> { new CreateCrewMemberDto { Name = "Crew1", Nationality = "TestNat" } }
//         };
//
//         // Create a valid representative
//         _validRepresentative = new ShippingAgentRepresentative(
//             new CitizenId("12345678Z"),
//             new RepresentativeName("Test Rep"),
//             new RepresentativePhone("961234567"),
//             new RepresentativeNationality("TestNat"),
//             new RepresentativeEmail("test@test.com")
//         );
//
//         // Set up the representative repository mock
//         _mockRepRepo.Setup(r => r.GetByCitizenIdAsync(new CitizenId("12345678Z")))
//             .ReturnsAsync(_validRepresentative);
//
//         // Create an existing notification for update/submit tests
//         _existingNotification = global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification.Create(
//             new ETA(_validCreateDto.EstimatedArrival),
//             new ETD(_validCreateDto.EstimatedDeparture),
//             _validVesselImo,
//             _validRepresentativeId,
//             new Cargo(_validCreateDto.Cargo.Description, _validCreateDto.Cargo.Weight, _validCreateDto.Cargo.Containers.Select(c=> new Container(new ContainerCode(c.ContainerCode), c.Position)).ToList()),
//             _validCreateDto.CrewMembers.Select(cm => new CrewMember(cm.Name, cm.Nationality, false)).ToList()
//         );
//         // Set BusinessId for testing
//         SetPrivateField(_existingNotification, "BusinessId", _validNotificationBusinessId);
//     }
//
//     // --- CreateAsync Tests ---
//
//     [TestMethod]
//     public async Task CreateAsync_WithValidData_ShouldCallRepoAddAndSaveChangesAndReturnDto()
//     {
//         // Arrange - setup in TestInitialize
//
//         // Act
//         var resultDto = await _service.CreateAsync(_validCreateDto, null);
//
//         // Assert
//         Assert.IsNotNull(resultDto);
//         Assert.AreEqual(_validCreateDto.VesselImo, resultDto.VesselImo);
//         Assert.AreEqual(NotificationStatus.InProgress.ToString(), resultDto.Status);
//         Assert.IsNotNull(resultDto.BusinessId);
//         Assert.AreEqual(1, resultDto.CrewMembers.Count);
//
//         _mockRepo.Verify(r => r.AddAsync(It.IsAny<global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification>()), Times.Once);
//         _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
//     }
//
//     [TestMethod]
//     public async Task CreateAsync_WithInvalidCitizenId_ShouldThrowKeyNotFoundException()
//     {
//         // Arrange
//         _mockRepRepo.Setup(r => r.GetByCitizenIdAsync(It.IsAny<CitizenId>()))
//             .ReturnsAsync((ShippingAgentRepresentative?)null);
//         
//         var dtoWithInvalidRep = new CreateVvnDto
//         {
//             EstimatedArrival = DateTime.UtcNow.AddHours(1),
//             EstimatedDeparture = DateTime.UtcNow.AddHours(10),
//             VesselImo = _validVesselImo.Value,
//             RepresentativeCitizenId = "99999999Z",
//             Cargo = _validCreateDto.Cargo
//         };
//
//         // Act & Assert
//         await Assert.ThrowsExceptionAsync<KeyNotFoundException>(() =>
//             _service.CreateAsync(dtoWithInvalidRep, null)
//         );
//     }
//
//      [TestMethod]
//     public async Task CreateAsync_WithArrivalAfterDeparture_ShouldThrowArgumentException()
//     {
//         // Arrange
//          var invalidDto = new CreateVvnDto
//         {
//             EstimatedArrival = DateTime.UtcNow.AddHours(10), // AFTER departure
//             EstimatedDeparture = DateTime.UtcNow.AddHours(1),
//             VesselImo = _validVesselImo.Value,
//             RepresentativeCitizenId = "12345678Z",
//             Cargo = _validCreateDto.Cargo
//         };
//
//         // Act & Assert
//         await Assert.ThrowsExceptionAsync<ArgumentException>(() =>
//             _service.CreateAsync(invalidDto, null)
//         );
//     }
//
//     // --- UpdateAsync Tests ---
//
//     [TestMethod]
//     public async Task UpdateAsync_WhenNotificationExistsAndInProgress_ShouldUpdateAndSaveChanges()
//     {
//         // Arrange
//         SetPrivateField(_existingNotification, "Status", NotificationStatus.InProgress);
//         _mockRepo.Setup(r => r.GetByBusinessIdAsync(_validNotificationBusinessId))
//             .ReturnsAsync(_existingNotification);
//
//         var updateDto = new CreateVvnDto
//         {
//              EstimatedArrival = _validCreateDto.EstimatedArrival.AddMinutes(30),
//              EstimatedDeparture = _validCreateDto.EstimatedDeparture.AddMinutes(30),
//              VesselImo = _validCreateDto.VesselImo,
//              RepresentativeCitizenId = _validCreateDto.RepresentativeCitizenId,
//              Cargo = new CreateCargoDto { Description = "Updated Cargo", Weight = 1500, Containers = new List<CreateContainerDto>() },
//              CrewMembers = new List<CreateCrewMemberDto>()
//         };
//
//         // Act
//         var resultDto = await _service.UpdateAsync(_validNotificationBusinessId, updateDto);
//
//         // Assert
//         Assert.IsNotNull(resultDto);
//         Assert.AreEqual("Updated Cargo", resultDto.Cargo.Description);
//         _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
//     }
//
//     [TestMethod]
//     public async Task UpdateAsync_WhenNotificationNotFound_ShouldThrowKeyNotFoundException()
//     {
//         // Arrange
//         _mockRepo.Setup(r => r.GetByBusinessIdAsync(It.IsAny<string>()))
//             .ReturnsAsync((global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification?)null);
//         var updateDto = _validCreateDto;
//
//         // Act & Assert
//         await Assert.ThrowsExceptionAsync<KeyNotFoundException>(() =>
//             _service.UpdateAsync("NONEXISTENT", updateDto)
//         );
//     }
//
//     // --- SubmitAsync Tests ---
//     [TestMethod]
//     public async Task SubmitAsync_WhenInProgress_ShouldCallSubmitAndSaveChanges()
//     {
//         // Arrange
//         SetPrivateField(_existingNotification, "Status", NotificationStatus.InProgress);
//         _mockRepo.Setup(r => r.GetByBusinessIdAsync(_validNotificationBusinessId))
//             .ReturnsAsync(_existingNotification);
//
//         // Act
//         await _service.SubmitAsync(_validNotificationBusinessId);
//
//         // Assert
//         Assert.AreEqual(NotificationStatus.Submitted, _existingNotification.Status);
//         _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
//     }
//
//     [TestMethod]
//     public async Task SubmitAsync_WhenNotFound_ShouldThrowKeyNotFoundException()
//     {
//         // Arrange
//         _mockRepo.Setup(r => r.GetByBusinessIdAsync(It.IsAny<string>()))
//             .ReturnsAsync((global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification?)null);
//
//         // Act & Assert
//         await Assert.ThrowsExceptionAsync<KeyNotFoundException>(() =>
//             _service.SubmitAsync("NONEXISTENT")
//         );
//     }
//
//      [TestMethod]
//     public async Task SubmitAsync_WhenStatusNotInProgress_ShouldThrowInvalidOperationException()
//     {
//         // Arrange
//         SetPrivateField(_existingNotification, "Status", NotificationStatus.Submitted);
//         _mockRepo.Setup(r => r.GetByBusinessIdAsync(_validNotificationBusinessId))
//             .ReturnsAsync(_existingNotification);
//
//         // Act & Assert
//         await Assert.ThrowsExceptionAsync<InvalidOperationException>(() =>
//             _service.SubmitAsync(_validNotificationBusinessId)
//         );
//     }
//
//     // --- GetByBusinessIdAsync Tests ---
//     [TestMethod]
//     public async Task GetByBusinessIdAsync_WhenFound_ShouldReturnMappedDto()
//     {
//         // Arrange
//         _mockRepo.Setup(r => r.GetByBusinessIdAsync(_validNotificationBusinessId))
//             .ReturnsAsync(_existingNotification);
//
//         // Act
//         var result = await _service.GetByBusinessIdAsync(_validNotificationBusinessId);
//
//         // Assert
//         Assert.IsNotNull(result);
//         Assert.AreEqual(_validNotificationBusinessId, result.BusinessId);
//         Assert.AreEqual(_validVesselImo.Value, result.VesselImo);
//     }
//
//     [TestMethod]
//     public async Task GetByBusinessIdAsync_WhenNotFound_ShouldReturnNull()
//     {
//         // Arrange
//         _mockRepo.Setup(r => r.GetByBusinessIdAsync(It.IsAny<string>()))
//             .ReturnsAsync((global::PortProject.Api.Domain.VesselVisitNotificationAggregate.VesselVisitNotification?)null);
//
//         // Act
//         var result = await _service.GetByBusinessIdAsync("NONEXISTENT");
//
//         // Assert
//         Assert.IsNull(result);
//     }
//
//     // Helper method to set private fields using reflection
//     private void SetPrivateField(object obj, string fieldName, object value)
//     {
//         var field = obj.GetType().GetField($"<{fieldName}>k__BackingField", 
//             System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
//         if (field != null)
//         {
//             field.SetValue(obj, value);
//         }
//     }
// }