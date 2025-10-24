using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.VesselVisitNotification.DTOs;
using PortProject.Api.Application.VesselVisitNotification.Services;
using PortProject.Api.Controllers;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PortProject.Api.Tests.Controllers;

[TestClass]
public class VesselVisitNotificationControllerTests
{
    private Mock<IVesselVisitNotificationService> _mockService = null!;
    private VesselVisitNotificationController _controller = null!;
    private CreateVvnDto _validCreateDto = null!;
    private VesselVisitNotificationDto _validResultDto = null!;
    private string _validNotificationId = null!;

    [TestInitialize]
    public void TestInitialize()
    {
        _mockService = new Mock<IVesselVisitNotificationService>();
        _controller = new VesselVisitNotificationController(_mockService.Object);

        _validNotificationId = Guid.NewGuid().ToString();
        _validCreateDto = new CreateVvnDto { RepresentativeId = Guid.NewGuid().ToString(), Cargo = new CreateCargoDto() /* Add other required fields */ };
        _validResultDto = new VesselVisitNotificationDto { Id = Guid.Parse(_validNotificationId) /* Add other fields */ };
    }

    // --- Create Tests ---

    [TestMethod]
    public async Task Create_WithValidDto_ShouldCallServiceAndReturnCreatedAtAction()
    {
        // Arrange
        _mockService.Setup(s => s.CreateAsync(_validCreateDto, _validCreateDto.RepresentativeId))
                    .ReturnsAsync(_validResultDto);

        // Act
        var result = await _controller.Create(_validCreateDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(CreatedAtActionResult));
        var actionResult = (CreatedAtActionResult)result.Result!;
        Assert.AreEqual(nameof(_controller.GetById), actionResult.ActionName);
        Assert.AreEqual(201, actionResult.StatusCode);
        Assert.AreEqual(_validResultDto, actionResult.Value);
        _mockService.Verify(s => s.CreateAsync(_validCreateDto, _validCreateDto.RepresentativeId), Times.Once);
    }

    [TestMethod]
    public async Task Create_WhenDtoMissingRepId_ShouldReturnBadRequest()
    {
        // Arrange
        var invalidDto = new CreateVvnDto { RepresentativeId = "", Cargo = new CreateCargoDto() }; // Missing RepId

        // Act
        var result = await _controller.Create(invalidDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(BadRequestObjectResult));
    }

     [TestMethod]
    public async Task Create_WhenServiceThrowsArgumentException_ShouldReturnBadRequest()
    {
        // Arrange
        _mockService.Setup(s => s.CreateAsync(_validCreateDto, _validCreateDto.RepresentativeId))
                    .ThrowsAsync(new ArgumentException("Invalid data"));

        // Act
        var result = await _controller.Create(_validCreateDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(BadRequestObjectResult));
    }

     [TestMethod]
    public async Task Create_WhenServiceThrowsFormatException_ShouldReturnBadRequest()
    {
        // Arrange
        _mockService.Setup(s => s.CreateAsync(_validCreateDto, _validCreateDto.RepresentativeId))
                    .ThrowsAsync(new FormatException("Invalid GUID"));

        // Act
        var result = await _controller.Create(_validCreateDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(BadRequestObjectResult));
    }

     [TestMethod]
    public async Task Create_WhenServiceThrowsGenericException_ShouldReturnInternalServerError()
    {
        // Arrange
        _mockService.Setup(s => s.CreateAsync(_validCreateDto, _validCreateDto.RepresentativeId))
                    .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.Create(_validCreateDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(ObjectResult));
        var objectResult = (ObjectResult)result.Result!;
        Assert.AreEqual(500, objectResult.StatusCode);
    }

    // --- Update Tests ---

    [TestMethod]
    public async Task Update_WhenServiceSucceeds_ShouldReturnOk()
    {
         // Arrange
        _mockService.Setup(s => s.UpdateAsync(_validNotificationId, _validCreateDto))
                    .ReturnsAsync(_validResultDto);

        // Act
        var result = await _controller.Update(_validNotificationId, _validCreateDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        _mockService.Verify(s => s.UpdateAsync(_validNotificationId, _validCreateDto), Times.Once);
    }

     [TestMethod]
    public async Task Update_WhenServiceThrowsKeyNotFound_ShouldReturnNotFound()
    {
        // Arrange
        _mockService.Setup(s => s.UpdateAsync(_validNotificationId, _validCreateDto))
                    .ThrowsAsync(new KeyNotFoundException("Not found"));

        // Act
        var result = await _controller.Update(_validNotificationId, _validCreateDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(NotFoundObjectResult));
    }

    // --- Submit Tests ---
    [TestMethod]
    public async Task Submit_WhenServiceSucceeds_ShouldReturnNoContent()
    {
         // Arrange
        _mockService.Setup(s => s.SubmitAsync(_validNotificationId))
                    .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.Submit(_validNotificationId);

        // Assert
        Assert.IsInstanceOfType(result, typeof(NoContentResult));
        _mockService.Verify(s => s.SubmitAsync(_validNotificationId), Times.Once);
    }

     [TestMethod]
    public async Task Submit_WhenServiceThrowsKeyNotFound_ShouldReturnNotFound()
    {
        // Arrange
        _mockService.Setup(s => s.SubmitAsync(_validNotificationId))
                    .ThrowsAsync(new KeyNotFoundException("Not found"));

        // Act
        var result = await _controller.Submit(_validNotificationId);

        // Assert
        Assert.IsInstanceOfType(result, typeof(NotFoundObjectResult));
    }

    // --- GetById Tests ---
    [TestMethod]
    public async Task GetById_WhenFound_ShouldReturnOk()
    {
         // Arrange
        _mockService.Setup(s => s.GetByIdAsync(_validNotificationId))
                    .ReturnsAsync(_validResultDto);

        // Act
        var result = await _controller.GetById(_validNotificationId);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        var okResult = (OkObjectResult)result.Result!;
        Assert.AreEqual(_validResultDto, okResult.Value);
    }

    [TestMethod]
    public async Task GetById_WhenNotFound_ShouldReturnNotFound()
    {
         // Arrange
        _mockService.Setup(s => s.GetByIdAsync(_validNotificationId))
                    .ReturnsAsync((VesselVisitNotificationDto?)null);

        // Act
        var result = await _controller.GetById(_validNotificationId);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(NotFoundObjectResult));
    }

     [TestMethod]
    public async Task GetById_WhenInvalidIdFormat_ShouldReturnBadRequest()
    {
        // Arrange
        var invalidId = "not-a-guid";
        // Service will throw FormatException when converting string to Guid
         _mockService.Setup(s => s.GetByIdAsync(invalidId)).ThrowsAsync(new FormatException());


        // Act
        var result = await _controller.GetById(invalidId);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(BadRequestObjectResult));
        // Verify service was NOT successfully called with the parsed Guid
    }

    // Add tests for Approve, Reject, Search similarly...
}