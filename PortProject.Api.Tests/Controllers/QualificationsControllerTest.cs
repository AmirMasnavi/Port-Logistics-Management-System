using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.Qualifications;
using PortProject.Api.Application.Qualifications.DTOs;
using PortProject.Api.Controllers;
using System;
using System.Threading.Tasks;

namespace PortProject.Api.Tests.Controllers;

[TestClass]
public class QualificationsControllerTest
{
    private readonly Mock<IQualificationService> _mockService;
    private readonly QualificationsController _controller;

    public QualificationsControllerTest()
    {
        _mockService = new Mock<IQualificationService>();
        _controller = new QualificationsController(_mockService.Object);
    }

    [TestMethod]
    public async Task CreateQualification_WhenServiceSucceeds_ShouldReturnCreatedAtAction()
    {
        // Arrange
        var createDto = new CreateQualificationDto();
        var resultDto = new QualificationDto { Code = "Q01" };
        _mockService.Setup(s => s.CreateAsync(createDto)).ReturnsAsync(resultDto);

        // Act
        var result = await _controller.CreateQualification(createDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(CreatedAtActionResult));
        var actionResult = (CreatedAtActionResult)result.Result;
        Assert.AreEqual(201, actionResult.StatusCode);
        Assert.AreEqual(resultDto, actionResult.Value);
    }

    [TestMethod]
    public async Task CreateQualification_WhenServiceThrowsArgumentException_ShouldReturnBadRequest()
    {
        // Arrange
        var createDto = new CreateQualificationDto();
        _mockService.Setup(s => s.CreateAsync(createDto)).ThrowsAsync(new ArgumentException("Invalid data"));

        // Act
        var result = await _controller.CreateQualification(createDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(BadRequestObjectResult));
    }
}