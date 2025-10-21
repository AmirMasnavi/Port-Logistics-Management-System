using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.StorageAreas.DTOs;
using PortProject.Api.Application.StorageAreas.Services;

namespace PortProject.Api.Tests.Controllers;

[TestClass]
public class StorageAreaControllerTest
{
    private readonly Mock<IStorageAreaService> _mockService;
    
    public StorageAreaControllerTest()
    {
        _mockService = new Mock<IStorageAreaService>();
    }
    
    [TestMethod]
    public async Task CreateStorageArea_WithValidDto_ShouldReturnCreatedAtAction()
    {
        // Arrange
        var createDto = new CreateStorageAreaDto
        {
            Type = "Yard",
            Location = "Dock 1",
            Capacity = 500
        };

        var expected = new StorageAreaDto
        {
            Id = "1",
            Type = "Yard",
            Location = "Dock 1",
            Capacity = 500
        };

        _mockService
            .Setup(s => s.CreateStorageAreaAsync(It.Is<CreateStorageAreaDto>(d => d.Type == createDto.Type && d.Location == createDto.Location)))
            .ReturnsAsync(expected);

        var controller = new PortProject.Api.Controllers.StorageAreaController(_mockService.Object);

        // Act
        var result = await controller.CreateStorageArea(createDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(Microsoft.AspNetCore.Mvc.CreatedAtActionResult));
        var created = (Microsoft.AspNetCore.Mvc.CreatedAtActionResult)result.Result;
        Assert.AreEqual("GetStorageAreaById", created.ActionName);
        Assert.AreEqual(expected, created.Value);
    }
    
    [TestMethod]
    public async Task GetStorageAreaById_WithNonExistentId_ShouldReturnNotFound()
    {
        // Arrange
        int nonExistentId = 99999;

        _mockService
            .Setup(s => s.GetByIdAsync(nonExistentId))
            .ReturnsAsync((StorageAreaDto?)null);

        var controller = new PortProject.Api.Controllers.StorageAreaController(_mockService.Object);

        // Act
        var result = await controller.GetStorageAreaById(nonExistentId);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(Microsoft.AspNetCore.Mvc.NotFoundObjectResult));
        var notFound = (Microsoft.AspNetCore.Mvc.NotFoundObjectResult)result.Result;
        Assert.AreEqual($"Storage area with ID {nonExistentId} not found.", notFound.Value);
    }
}