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
    [TestMethod]
    public async Task Reject_WhenServiceSucceeds_ShouldReturnNoContent()
    {
        var rejectDto = new RejectVvnDto { OfficerId = "OFFICER2", Reason = "Missing info" };
        _mockService.Setup(s => s.RejectAsync(_validNotificationId, rejectDto))
            .ReturnsAsync(_validResultDto);

        var result = await _controller.RejectVvn(_validNotificationId, rejectDto);

        Assert.IsInstanceOfType(result, typeof(NoContentResult));
    }

    [TestMethod]
    public async Task Reject_WhenNotFound_ShouldReturnNotFound()
    {
        var rejectDto = new RejectVvnDto { OfficerId = "OFFICER2", Reason = "Missing info" };
        _mockService.Setup(s => s.RejectAsync(_validNotificationId, rejectDto))
            .ThrowsAsync(new KeyNotFoundException());

        var result = await _controller.RejectVvn(_validNotificationId, rejectDto);

        Assert.IsInstanceOfType(result, typeof(NotFoundObjectResult));
    }

    [TestMethod]
    public async Task Reject_WhenInvalidState_ShouldReturnBadRequest()
    {
        var rejectDto = new RejectVvnDto { OfficerId = "OFFICER2", Reason = "Missing info" };
        _mockService.Setup(s => s.RejectAsync(_validNotificationId, rejectDto))
            .ThrowsAsync(new InvalidOperationException("Cannot reject"));

        var result = await _controller.RejectVvn(_validNotificationId, rejectDto);

        Assert.IsInstanceOfType(result, typeof(BadRequestObjectResult));
    }
    [TestMethod]
    public async Task Resubmit_WhenServiceSucceeds_ShouldReturnNoContent()
    {
        _mockService.Setup(s => s.ReopenAsync(_validNotificationId))
            .Returns(Task.CompletedTask); 

        var result = await _controller.ReopenVvn(_validNotificationId);

        Assert.IsInstanceOfType(result, typeof(NoContentResult));
    }


    [TestMethod]
    public async Task Resubmit_WhenNotFound_ShouldReturnNotFound()
    {
        _mockService.Setup(s => s.ReopenAsync(_validNotificationId))
            .ThrowsAsync(new KeyNotFoundException());

        var result = await _controller.ReopenVvn(_validNotificationId);

        Assert.IsInstanceOfType(result, typeof(NotFoundObjectResult));
    }

    [TestMethod]
    public async Task Resubmit_WhenInvalidState_ShouldReturnBadRequest()
    {
        _mockService.Setup(s => s.ReopenAsync(_validNotificationId))
            .ThrowsAsync(new InvalidOperationException("Cannot resubmit"));

        var result = await _controller.ReopenVvn(_validNotificationId);

        Assert.IsInstanceOfType(result, typeof(BadRequestObjectResult));
    }
    
    [TestMethod]
    public async Task Search_WhenCalled_ShouldReturnOkWithResults()
    {
        var expectedList = new List<VesselVisitNotificationDto> { _validResultDto };
        _mockService.Setup(s => s.SearchAsync(null, null, null, null, null))
            .ReturnsAsync(expectedList);

        var result = await _controller.Search(null, null, null, null, null);

        Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        var okResult = (OkObjectResult)result.Result!;
        Assert.AreEqual(expectedList, okResult.Value);
    }
    
    [TestMethod]
    public async Task GetNotificationsForRepresentative_WhenCalled_ShouldReturnOkWithResults()
    {
        var filter = new VvnSearchFilterDto { RepresentativeId = Guid.NewGuid().ToString() };
        var expectedList = new List<VesselVisitNotificationDto> { _validResultDto };
        _mockService.Setup(s => s.GetNotificationsForRepresentativeAsync(filter))
            .ReturnsAsync(expectedList);

        var result = await _controller.GetNotificationsForRepresentative(filter);

        Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        var okResult = (OkObjectResult)result.Result!;
        Assert.AreEqual(expectedList, okResult.Value);
    }
}