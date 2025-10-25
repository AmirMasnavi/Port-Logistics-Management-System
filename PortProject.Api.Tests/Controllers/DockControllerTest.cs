using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.Dock.DTOs;
using PortProject.Api.Application.Dock.Services;
using PortProject.Api.Controllers;

namespace PortProject.Api.Tests.Controllers;

[TestClass]
public class DockControllerTests
{
    private readonly Mock<IDockService> _mockService;
    private readonly DockController _controller;

    public DockControllerTests()
    {
        _mockService = new Mock<IDockService>();
        _controller = new DockController(_mockService.Object);
    }

    [TestMethod]
    public async Task CreateDock_WithValidDto_ShouldReturnCreatedAtAction()
    {
        // Arrange
        var createDto = new DockCreateDto
        {
            Id = "DOCK1",
            Name = "Main Dock",
            LocationZone = "Zone A",
            LocationSection = "Section 1",
            LengthInMeters = 300,
            DepthInMeters = 15,
            MaxDraftInMeters = 12,
            NumberOfSTSCranes = 2,
            AllowedVesselTypeIds = new List<string> { "1001", "1002" }
        };

        var expected = new DockDto
        {
            Id = "DOCK1",
            Name = "Main Dock",
            LocationZone = "Zone A",
            LocationSection = "Section 1",
            LengthInMeters = 300,
            DepthInMeters = 15,
            MaxDraftInMeters = 12,
            NumberOfSTSCranes = 2,
            AllowedVesselTypeIds = new List<string> { "1001", "1002" }
        };

        _mockService
            .Setup(s => s.CreateDockAsync(It.Is<DockCreateDto>(d => d.Id == createDto.Id)))
            .ReturnsAsync(expected);

        // Act
        var result = await _controller.CreateDock(createDto); // IActionResult
        var created = result as CreatedAtActionResult;

        Assert.IsNotNull(created);
        Assert.AreEqual(201, created.StatusCode);

        var returned = created.Value as DockDto;
        Assert.IsNotNull(returned);
        Assert.AreEqual("DOCK1", returned.Id);
        Assert.AreEqual("Main Dock", returned.Name);
    }

    [TestMethod]
    public async Task GetDockById_WhenNotFound_ShouldReturnNotFound()
    {
        // Arrange
        var id = "DOCK999";
        _mockService
            .Setup(s => s.GetDockByIdAsync(id))
            .ReturnsAsync((DockDto)null);

        // Act
        var result = await _controller.GetDockById(id);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(NotFoundObjectResult));
        var notFound = (NotFoundObjectResult)result.Result;
        Assert.AreEqual(404, notFound.StatusCode);
    }

    [TestMethod]
    public async Task UpdateDock_IdMismatch_ShouldReturnBadRequest()
    {
        // Arrange
        var id = "DOCK1";
        var dto = new DockDto { Id = "DOCK2", Name = "Mismatch Dock" };

        // Act
        var result = await _controller.UpdateDock(id, dto);

        Assert.IsInstanceOfType(result, typeof(BadRequestObjectResult));
        var bad = result as BadRequestObjectResult;
        Assert.IsNotNull(bad);
        Assert.AreEqual(400, bad.StatusCode);

    }

    [TestMethod]
    public async Task DeleteDock_WhenServiceThrowsKeyNotFound_ShouldReturnNotFound()
    {
        // Arrange
        var id = "DOCK55";
        _mockService
            .Setup(s => s.DeleteDockAsync(id))
            .ThrowsAsync(new KeyNotFoundException("not found"));

        // Act
        var result = await _controller.DeleteDock(id);

        // Assert
        Assert.IsInstanceOfType(result, typeof(NotFoundObjectResult));
        var notFound = (NotFoundObjectResult)result;
        Assert.AreEqual(404, notFound.StatusCode);
    }

    [TestMethod]
    public async Task DeleteDock_Success_ShouldReturnNoContent()
    {
        // Arrange
        var id = "DOCK55";
        _mockService
            .Setup(s => s.DeleteDockAsync(id))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _controller.DeleteDock(id);

        // Assert
        Assert.IsInstanceOfType(result, typeof(NoContentResult));
        var noContent = (NoContentResult)result;
        Assert.AreEqual(204, noContent.StatusCode);
    }

    [TestMethod]
    public async Task SearchDock_WithFilters_ShouldReturnMatchingResults()
    {
        // Arrange
        var docks = new List<DockDto>
        {
            new DockDto { Id = "DOCK1", Name = "Filtered Dock" }
        };

        _mockService
            .Setup(s => s.SearchDocksAsync("Filtered Dock", null, null, null, 1, 10, "name", "asc"))
            .ReturnsAsync(docks);

        // Act
        var result = await _controller.SearchDock("Filtered Dock", null, null, null, 1, 10, "name", "asc");

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        var ok = (OkObjectResult)result.Result;
        Assert.AreEqual(docks, ok.Value);
    }

    [TestMethod]
    public async Task GetAllDocks_ShouldReturnListOfDocks()
    {
        // Arrange
        var docks = new List<DockDto>
        {
            new DockDto { Id = "DOCK1", Name = "Dock 1" },
            new DockDto { Id = "DOCK2", Name = "Dock 2" }
        };

        _mockService
            .Setup(s => s.GetAllDocksAsync())
            .ReturnsAsync(docks);

        // Act
        var result = await _controller.GetAllDocks();

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
        var ok = (OkObjectResult)result.Result;
        Assert.AreEqual(docks, ok.Value);
    }
}
