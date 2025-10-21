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
            Capacity = 500
        };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<DomainStorageArea>()))
            .Callback<DomainStorageArea>(sa =>
            {
                var idProp = typeof(DomainStorageArea).GetProperty("Id");
                var idType = idProp.PropertyType;
                var idInstance = Activator.CreateInstance(idType, 1);
                idProp.SetValue(sa, idInstance);
            })
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
        Assert.Equal("1", result.Id);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<DomainStorageArea>()), Times.Once);
        _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
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
            Capacity = 500
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
            Capacity = 500
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
            Capacity = 500
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
            Capacity = 500
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
            Capacity = -1
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
            Capacity = 0
        };
        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateStorageAreaAsync(dto));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<DomainStorageArea>()), Times.Never);
    }
}