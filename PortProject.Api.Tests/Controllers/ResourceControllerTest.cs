using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.Resources.DTOs;
using PortProject.Api.Application.Resources.Services;

namespace PortProject.Api.Tests.Controllers;

[TestClass]
public class ResourceControllerTest
{
    private readonly Mock<IResourceService> _mockResourceService;
    
    public ResourceControllerTest()
    {
        _mockResourceService = new Mock<IResourceService>();
    }
    
    
    [TestMethod]
    public async Task CreateResource_WithValidDto_ShouldReturnCreatedAtAction()
    {
        // Arrange
        var createDto = new CreateResourceDto()
        {
            Code = "RES123",
            Description = "A resource for testing",
            Kind = "Crane",
            Status = "Active",
            SetupTimeMinutes = 0,
            OperationalWindowStart = new TimeOnly(8, 0),
            OperationalWindowEnd = new TimeOnly(18, 0)
        };

        var expected = new ResourceDto
        {
            Code = "RES123",
            Description = "A resource for testing",
            Kind = "Crane",
            AssignedArea = null,
            Status = "Active",
            SetupTimeMinutes = 0,
            OperationalWindowStart = "08:00",
            OperationalWindowEnd = "18:00",
            QualificationRequirements = null,
            AverageContainersPerHour = 10
        };

        _mockResourceService
            .Setup(s => s.CreateResourceAsync(It.Is<CreateResourceDto>(d => d.Code == createDto.Code && d.Description == createDto.Description)))
            .ReturnsAsync(expected);

        var controller = new PortProject.Api.Controllers.ResourceController(_mockResourceService.Object);

        // Act
        var result = await controller.CreateResource(createDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(CreatedAtActionResult));
        var created = (CreatedAtActionResult)result.Result;
        Assert.AreEqual("GetResourceByCode", created.ActionName);
        Assert.AreEqual(expected, created.Value);
    }

    [TestMethod]
    public async Task GetResourceByCode_WithNonExistentCode_ShouldReturnNotFound()
    {
        // Arrange
        string code = "UNKNOWN";

        _mockResourceService
            .Setup(s => s.GetByCodeAsync(code))
            .ReturnsAsync((ResourceDto?)null);

        var controller = new PortProject.Api.Controllers.ResourceController(_mockResourceService.Object);

        // Act
        var result = await controller.GetResourceByCode(code);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(NotFoundObjectResult));
        var notFound = (NotFoundObjectResult)result.Result!;
        Assert.AreEqual($"Resource with code {code} not found.", notFound.Value);
    }

    [TestMethod]
    public async Task CreateResource_ServiceThrowsArgumentException_ShouldReturnBadRequest()
    {
        // Arrange
        var createDto = new CreateResourceDto()
        {
            Code = "RES_ERR",
            Description = "Invalid",
            Kind = "Crane",
            Status = "Active",
            SetupTimeMinutes = 0,
            OperationalWindowStart = new TimeOnly(8, 0),
            OperationalWindowEnd = new TimeOnly(18, 0)
        };

        _mockResourceService
            .Setup(s => s.CreateResourceAsync(It.IsAny<CreateResourceDto>()))
            .ThrowsAsync(new ArgumentException("Invalid payload"));

        var controller = new PortProject.Api.Controllers.ResourceController(_mockResourceService.Object);

        // Act
        var result = await controller.CreateResource(createDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(BadRequestObjectResult));
        var badRequest = (BadRequestObjectResult)result.Result!;
        var payload = badRequest.Value!;
        var messageProp = payload.GetType().GetProperty("message");
        Assert.IsNotNull(messageProp);
        Assert.AreEqual("Invalid payload", messageProp!.GetValue(payload));
    }
}