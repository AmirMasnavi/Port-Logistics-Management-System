using System.Collections.Generic;
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
    public async Task CreateStorageArea_WithValidDto_ShouldReturnCreated()
    {
        // Arrange
        var createDto = new CreateStorageAreaDto
        {
            Type = "Yard",
            Location = "10, 10",
            Capacity = 500,
            CurrentOccupancy = 0
        };

        var expected = new StorageAreaDto
        {
            Code = "YARD-001",
            Type = "Yard",
            Location = "10, 10",
            Capacity = 500,
            CurrentOccupancy = 0
        };

        _mockService
            .Setup(s => s.CreateStorageAreaAsync(It.Is<CreateStorageAreaDto>(
                d => d.Type == createDto.Type && d.Location == createDto.Location)))
            .ReturnsAsync(expected);

        var controller = new PortProject.Api.Controllers.StorageAreaController(_mockService.Object);

        // Act
        var result = await controller.CreateStorageArea(createDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(Microsoft.AspNetCore.Mvc.CreatedResult));
        var created = (Microsoft.AspNetCore.Mvc.CreatedResult)result.Result;
        Assert.AreEqual(string.Empty, created.Location);
        Assert.AreEqual(expected, created.Value);
    }
    
    [TestMethod]
    public async Task GetStorageAreaById_WithNonExistentCode_ShouldReturnNotFound()
    {
        // Arrange
        string nonExistentCode = "NONEXISTENT-001";

        _mockService
            .Setup(s => s.GetByIdAsync(nonExistentCode))
            .ReturnsAsync((StorageAreaDto?)null);

        var controller = new PortProject.Api.Controllers.StorageAreaController(_mockService.Object);

        // Act
        var result = await controller.GetStorageAreaById(nonExistentCode);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(Microsoft.AspNetCore.Mvc.NotFoundObjectResult));
        var notFound = (Microsoft.AspNetCore.Mvc.NotFoundObjectResult)result.Result;
        Assert.AreEqual($"Storage area with code {nonExistentCode} not found.", notFound.Value);
    }

    [TestMethod]
    public async Task GetStorageAreaById_WithExistingCode_ShouldReturnOk()
    {
        // Arrange
        string code = "YARD-001";
        var expected = new StorageAreaDto
        {
            Code = code,
            Type = "Yard",
            Location = "10, 10",
            Capacity = 500,
            CurrentOccupancy = 100
        };

        _mockService
            .Setup(s => s.GetByIdAsync(code))
            .ReturnsAsync(expected);

        var controller = new PortProject.Api.Controllers.StorageAreaController(_mockService.Object);

        // Act
        var result = await controller.GetStorageAreaById(code);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(Microsoft.AspNetCore.Mvc.OkObjectResult));
        var ok = (Microsoft.AspNetCore.Mvc.OkObjectResult)result.Result;
        Assert.AreEqual(expected, ok.Value);
    }

    [TestMethod]
    public async Task UpdateStorageArea_WithValidDto_ShouldReturnOk()
    {
        // Arrange
        string code = "YARD-001";
        var updateDto = new UpdateStorageAreaDto
        {
            Type = "Warehouse",
            Location = "20, 20",
            Capacity = 600,
            CurrentOccupancy = 200
        };

        var expected = new StorageAreaDto
        {
            Code = code,
            Type = "Warehouse",
            Location = "20, 20",
            Capacity = 600,
            CurrentOccupancy = 200
        };

        _mockService
            .Setup(s => s.UpdateStorageAreaAsync(code, It.IsAny<UpdateStorageAreaDto>()))
            .ReturnsAsync(expected);

        var controller = new PortProject.Api.Controllers.StorageAreaController(_mockService.Object);

        // Act
        var result = await controller.UpdateStorageArea(code, updateDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(Microsoft.AspNetCore.Mvc.OkObjectResult));
        var ok = (Microsoft.AspNetCore.Mvc.OkObjectResult)result.Result;
        Assert.AreEqual(expected, ok.Value);
    }

    [TestMethod]
    public async Task UpdateStorageArea_WithNonExistentCode_ShouldReturnNotFound()
    {
        // Arrange
        string nonExistentCode = "NONEXISTENT-001";
        var updateDto = new UpdateStorageAreaDto
        {
            Type = "Warehouse",
            Location = "20, 20",
            Capacity = 600,
            CurrentOccupancy = 200
        };

        _mockService
            .Setup(s => s.UpdateStorageAreaAsync(nonExistentCode, It.IsAny<UpdateStorageAreaDto>()))
            .ReturnsAsync((StorageAreaDto?)null);

        var controller = new PortProject.Api.Controllers.StorageAreaController(_mockService.Object);

        // Act
        var result = await controller.UpdateStorageArea(nonExistentCode, updateDto);

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(Microsoft.AspNetCore.Mvc.NotFoundObjectResult));
        var notFound = (Microsoft.AspNetCore.Mvc.NotFoundObjectResult)result.Result;
        Assert.AreEqual($"Storage area with code {nonExistentCode} not found.", notFound.Value);
    }

    [TestMethod]
    public async Task GetAllStorageAreas_ShouldReturnOkWithList()
    {
        // Arrange
        var expected = new List<StorageAreaDto>
        {
            new StorageAreaDto
            {
                Code = "YARD-001",
                Type = "Yard",
                Location = "10, 10",
                Capacity = 500,
                CurrentOccupancy = 100
            },
            new StorageAreaDto
            {
                Code = "WAREHOUSE-001",
                Type = "Warehouse",
                Location = "20, 20",
                Capacity = 800,
                CurrentOccupancy = 300
            }
        };

        _mockService
            .Setup(s => s.GetAllAsync())
            .ReturnsAsync(expected);

        var controller = new PortProject.Api.Controllers.StorageAreaController(_mockService.Object);

        // Act
        var result = await controller.GetAllStorageAreas();

        // Assert
        Assert.IsInstanceOfType(result.Result, typeof(Microsoft.AspNetCore.Mvc.OkObjectResult));
        var ok = (Microsoft.AspNetCore.Mvc.OkObjectResult)result.Result;
        var actualList = ok.Value as List<StorageAreaDto>;
        Assert.IsNotNull(actualList);
        Assert.AreEqual(expected.Count, actualList.Count);
        Assert.AreEqual(expected[0].Code, actualList[0].Code);
        Assert.AreEqual(expected[1].Code, actualList[1].Code);
    }
}