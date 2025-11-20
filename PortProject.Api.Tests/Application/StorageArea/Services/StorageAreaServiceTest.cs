using System;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using PortProject.Api.Application.StorageAreas.DTOs;
using PortProject.Api.Application.StorageAreas.Services;
using PortProject.Api.Domain.StorageAggregate;
using PortProject.Api.Models;
using Xunit;
using DomainStorageArea = PortProject.Api.Domain.StorageAggregate.StorageArea;

namespace PortProject.Api.Tests.Application.StorageArea.Services;

public class StorageAreaServiceTest
{
    private readonly Mock<IStorageAreaRepository> _mockRepository;
    private readonly Mock<PortProjectContext> _mockContext;
    private readonly StorageAreaService _service;

    public StorageAreaServiceTest()
    {
        _mockRepository = new Mock<IStorageAreaRepository>();
        _mockContext = new Mock<PortProjectContext>();
        _service = new StorageAreaService(_mockRepository.Object, _mockContext.Object);
    }

    [Fact]
    public async Task CreateStorageAreaAsync_ValidDto_ReturnsCreatedDto()
    {
        // Arrange
        var dto = new CreateStorageAreaDto
        {
            Type = "Yard",
            Location = "10, 10",
            Capacity = 500,
            CurrentOccupancy = 0
        };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<DomainStorageArea>()))
            .Returns(Task.CompletedTask);
        _mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // Act
        var result = await _service.CreateStorageAreaAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(dto.Type, result.Type);
        Assert.Equal("(10, 10)", result.Location);
        Assert.Equal(dto.Capacity, result.Capacity);
        Assert.Equal(dto.CurrentOccupancy, result.CurrentOccupancy);
        Assert.NotNull(result.Code);
        Assert.StartsWith("YARD-", result.Code); // Code should be auto-generated based on type
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<DomainStorageArea>()), Times.Once);
        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2)); // Called twice: once to save entity, once to update code
    }

    [Fact]
    public async Task CreateStorageAreaAsync_NullDto_ThrowsArgumentNullException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateStorageAreaAsync(null));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<DomainStorageArea>()), Times.Never);
        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateStorageAreaAsync_EmptyType_ThrowsArgumentException()
    {
        var dto = new CreateStorageAreaDto
        {
            Type = "",
            Location = "10, 10",
            Capacity = 500,
            CurrentOccupancy = 0
        };
        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateStorageAreaAsync(dto));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<DomainStorageArea>()), Times.Never);
    }

    [Fact]
    public async Task CreateStorageAreaAsync_WhitespaceType_ThrowsArgumentException()
    {
        var dto = new CreateStorageAreaDto
        {
            Type = "   ",
            Location = "10, 10",
            Capacity = 500,
            CurrentOccupancy = 0
        };
        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateStorageAreaAsync(dto));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<DomainStorageArea>()), Times.Never);
    }

    [Fact]
    public async Task CreateStorageAreaAsync_EmptyLocation_ThrowsArgumentException()
    {
        var dto = new CreateStorageAreaDto
        {
            Type = "Yard",
            Location = "",
            Capacity = 500,
            CurrentOccupancy = 0
        };
        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateStorageAreaAsync(dto));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<DomainStorageArea>()), Times.Never);
    }

    [Fact]
    public async Task CreateStorageAreaAsync_WhitespaceLocation_ThrowsArgumentException()
    {
        var dto = new CreateStorageAreaDto
        {
            Type = "Yard",
            Location = "   ",
            Capacity = 500,
            CurrentOccupancy = 0
        };
        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateStorageAreaAsync(dto));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<DomainStorageArea>()), Times.Never);
    }

    [Fact]
    public async Task CreateStorageAreaAsync_NegativeCapacity_ThrowsArgumentException()
    {
        var dto = new CreateStorageAreaDto
        {
            Type = "Yard",
            Location = "10, 10",
            Capacity = -1,
            CurrentOccupancy = 0
        };
        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateStorageAreaAsync(dto));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<DomainStorageArea>()), Times.Never);
    }

    [Fact]
    public async Task CreateStorageAreaAsync_ZeroCapacity_ThrowsArgumentException()
    {
        var dto = new CreateStorageAreaDto
        {
            Type = "Yard",
            Location = "10, 10",
            Capacity = 0,
            CurrentOccupancy = 0
        };
        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateStorageAreaAsync(dto));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<DomainStorageArea>()), Times.Never);
    }
}