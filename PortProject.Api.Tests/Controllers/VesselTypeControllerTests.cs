using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Controllers;
using src.Application.Services;
using src.Dto;

namespace PortProject.Api.Tests.Controllers;

[TestClass]
public class VesselTypeControllerTests
{
    private readonly Mock<IVesselTypeService> _mockService;
    private readonly VesselTypeController _controller;

    public VesselTypeControllerTests()
    {
        _mockService = new Mock<IVesselTypeService>();
        _controller = new VesselTypeController(_mockService.Object);
    }

    [TestMethod]
    public async Task CreateVesselType_WithValidDto_ShouldReturnCreatedAtAction()
    {
        // Arrange
        var createDto = new VesselTypeCreateDto
        {
            Id = "123",
            Name = "Container",
            Description = "Test",
            Capacity = 100,
            MaxRows = 4,
            MaxBays = 5,
            MaxTiers = 6
        };

        var expected = new VesselTypeDto
        {
            Id = "123",
            Name = "Container",
            Description = "Test",
            Capacity = 100,
            MaxRows = 4,
            MaxBays = 5,
            MaxTiers = 6
        };

        _mockService
            .Setup(s => s.CreateVesselTypeAsync(It.Is<VesselTypeDto>(d => d.Id == createDto.Id && d.Name == createDto.Name)))
            .ReturnsAsync(expected);

        // Act
        var result = await _controller.CreateVesselType(createDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(CreatedAtActionResult));
        var created = (CreatedAtActionResult)result.Result;
        Assert.AreEqual(201, created.StatusCode);
        Assert.IsNotNull(created.Value);
        var returned = created.Value as VesselTypeDto;
        Assert.IsNotNull(returned);
        Assert.AreEqual(expected.Id, returned.Id);
        Assert.AreEqual(expected.Name, returned.Name);
    }

    [TestMethod]
    public async Task GetVesselTypeById_WhenNotFound_ShouldReturnNotFound()
    {
        // Arrange
        var id = "999";
        _mockService
            .Setup(s => s.GetVesselTypeByIdAsync(id))
            .ReturnsAsync((VesselTypeDto)null);

        // Act
        var result = await _controller.GetVesselTypeById(id);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(NotFoundObjectResult));
        var notFound = (NotFoundObjectResult)result.Result;
        Assert.AreEqual(404, notFound.StatusCode);
    }

    [TestMethod]
    public async Task UpdateVesselType_IdMismatch_ShouldReturnBadRequest()
    {
        // Arrange
        var id = "1";
        var dto = new VesselTypeDto { Id = "2", Name = "X" };

        // Act
        var result = await _controller.UpdateVesselType(id, dto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(BadRequestObjectResult));
        var bad = (BadRequestObjectResult)result.Result;
        Assert.AreEqual(400, bad.StatusCode);
    }

    [TestMethod]
    public async Task DeleteVesselType_WhenServiceThrowsKeyNotFound_ShouldReturnNotFound()
    {
        // Arrange
        var id = "55";
        _mockService
            .Setup(s => s.DeleteVesselTypeAsync(id))
            .ThrowsAsync(new KeyNotFoundException("not found"));

        // Act
        var result = await _controller.DeleteVesselType(id);

        // Assert
        Assert.IsInstanceOfType(result, typeof(NotFoundObjectResult));
        var notFound = (NotFoundObjectResult)result;
        Assert.AreEqual(404, notFound.StatusCode);
    }

    [TestMethod]
    public async Task DeleteVesselType_Success_ShouldReturnNoContent()
    {
        // Arrange
        var id = "55";
        _mockService
            .Setup(s => s.DeleteVesselTypeAsync(id))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.DeleteVesselType(id);

        // Assert
        Assert.IsInstanceOfType(result, typeof(NoContentResult));
        var noContent = (NoContentResult)result;
        Assert.AreEqual(204, noContent.StatusCode);
    }
}
