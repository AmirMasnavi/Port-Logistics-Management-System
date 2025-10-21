using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Domain.VesselTypeAggregate;
using PortProject.Api.Services;
using src.Domain.VesselTypeAggregate;
using Xunit;

namespace PortProject.Api.Tests.Services;

public class VesselServiceTests
{
    private readonly Mock<IVesselRepository> _mockRepository;
    private readonly Mock<IVesselTypeRepository> _mockVesselTypeRepository;
    private readonly VesselService _service;

    public VesselServiceTests()
    {
        _mockRepository = new Mock<IVesselRepository>();
        _mockVesselTypeRepository = new Mock<IVesselTypeRepository>();
        _service = new VesselService(_mockRepository.Object, _mockVesselTypeRepository.Object);
    }

    #region CreateVesselAsync Tests

    [Fact]
    public async Task CreateVesselAsync_ValidDto_ReturnsCreatedDto()
    {
        // Arrange
        var dto = new VesselCreateDto
        {
            ImoNumber = "1234567", // valid IMO (checksum 7)
            Name = "Evergreen",
            VesselTypeId = "1001",
            Operator = "Evergreen Line"
        };

        _mockRepository.Setup(r => r.GetByImoAsync(It.IsAny<ImoNumber>()))
            .ReturnsAsync((Vessel?)null);

        _mockVesselTypeRepository.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
            .ReturnsAsync(VesselType.Create("1001", "Container Ship", "desc", 1000, 5, 5, 4));

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<Vessel>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.CreateVesselAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(dto.ImoNumber, result.ImoNumber);
        Assert.Equal(dto.Name, result.Name);
        Assert.Equal(dto.VesselTypeId, result.VesselTypeId);
        Assert.Equal(dto.Operator, result.Operator);

        _mockRepository.Verify(r => r.GetByImoAsync(It.IsAny<ImoNumber>()), Times.Once);
        _mockVesselTypeRepository.Verify(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()), Times.Once);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Vessel>()), Times.Once);
    }

    [Fact]
    public async Task CreateVesselAsync_NullDto_ThrowsArgumentNullException()
    {
        var ex = await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateVesselAsync(null!));
        Assert.Equal("dto", ex.ParamName);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Vessel>()), Times.Never);
    }

    [Fact]
    public async Task CreateVesselAsync_DuplicateImo_ThrowsInvalidOperationException()
    {
        // Arrange
        var dto = new VesselCreateDto { ImoNumber = "1234567", Name = "A", VesselTypeId = "1001", Operator = "Op" };

        _mockRepository.Setup(r => r.GetByImoAsync(It.IsAny<ImoNumber>()))
            .ReturnsAsync(Vessel.Create("1234567", "Existing", "1001", "Op"));

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateVesselAsync(dto));
        Assert.Contains("already exists", ex.Message);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Vessel>()), Times.Never);
    }

    [Fact]
    public async Task CreateVesselAsync_VesselTypeNotExists_ThrowsArgumentException()
    {
        // Arrange
        var dto = new VesselCreateDto { ImoNumber = "1234567", Name = "A", VesselTypeId = "9999", Operator = "Op" };

        _mockRepository.Setup(r => r.GetByImoAsync(It.IsAny<ImoNumber>()))
            .ReturnsAsync((Vessel?)null);

        _mockVesselTypeRepository.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
            .ReturnsAsync((VesselType?)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateVesselAsync(dto));
        Assert.Contains("does not exist", ex.Message);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Vessel>()), Times.Never);
    }

    [Fact]
    public async Task CreateVesselAsync_InvalidImo_ThrowsArgumentException()
    {
        // Arrange
        var dto = new VesselCreateDto { ImoNumber = "ABC1234", Name = "A", VesselTypeId = "1001", Operator = "Op" };

        // Act & Assert - ImoNumber constructor validates format and will throw
        await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateVesselAsync(dto));
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Vessel>()), Times.Never);
    }

    #endregion

    #region UpdateVesselAsync Tests

    [Fact]
    public async Task UpdateVesselAsync_ValidDto_ReturnsUpdatedDto()
    {
        // Arrange
        var existing = Vessel.Create("1234567", "Old", "1001", "OpOld");

        var dto = new VesselDto { ImoNumber = "1234567", Name = "NewName", VesselTypeId = "1002", Operator = "OpNew" };

        _mockRepository.Setup(r => r.GetByImoAsync(It.IsAny<ImoNumber>()))
            .ReturnsAsync(existing);

        _mockVesselTypeRepository.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
            .ReturnsAsync(VesselType.Create("1002", "T", "d", 1000, 5, 5, 4));

        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<Vessel>()))
            .ReturnsAsync((Vessel v) => v);

        // Act
        var result = await _service.UpdateVesselAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(dto.ImoNumber, result.ImoNumber);
        Assert.Equal("NewName", result.Name);
        Assert.Equal("1002", result.VesselTypeId);
        Assert.Equal("OpNew", result.Operator);

        _mockRepository.Verify(r => r.GetByImoAsync(It.IsAny<ImoNumber>()), Times.Once);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<Vessel>()), Times.Once);
    }

    [Fact]
    public async Task UpdateVesselAsync_NullDto_ThrowsArgumentNullException()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() => _service.UpdateVesselAsync(null!));
    }

    [Fact]
    public async Task UpdateVesselAsync_VesselNotFound_ThrowsKeyNotFoundException()
    {
        var dto = new VesselDto { ImoNumber = "1234567", Name = "N", VesselTypeId = "1001", Operator = "O" };

        _mockRepository.Setup(r => r.GetByImoAsync(It.IsAny<ImoNumber>()))
            .ReturnsAsync((Vessel?)null);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.UpdateVesselAsync(dto));
        Assert.Contains("not found", ex.Message);
    }

    [Fact]
    public async Task UpdateVesselAsync_VesselTypeNotFound_ThrowsArgumentException()
    {
        var existing = Vessel.Create("1234567", "Old", "1001", "OpOld");
        var dto = new VesselDto { ImoNumber = "1234567", Name = "NewName", VesselTypeId = "9999", Operator = "OpNew" };

        _mockRepository.Setup(r => r.GetByImoAsync(It.IsAny<ImoNumber>()))
            .ReturnsAsync(existing);

        _mockVesselTypeRepository.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
            .ReturnsAsync((VesselType?)null);

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.UpdateVesselAsync(dto));
        Assert.Contains("not found", ex.Message);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<Vessel>()), Times.Never);
    }

    #endregion

    #region GetVesselByImoAsync Tests

    [Fact]
    public async Task GetVesselByImoAsync_Existing_ReturnsDto()
    {
        var vessel = Vessel.Create("1234567", "Name", "1001", "Op");
        _mockRepository.Setup(r => r.GetByImoAsync(It.IsAny<ImoNumber>()))
            .ReturnsAsync(vessel);

        var result = await _service.GetVesselByImoAsync("1234567");

        Assert.NotNull(result);
        Assert.Equal("1234567", result.ImoNumber);
        Assert.Equal("Name", result.Name);
    }

    [Fact]
    public async Task GetVesselByImoAsync_Empty_ThrowsArgumentException()
    {
        await Assert.ThrowsAsync<ArgumentException>(() => _service.GetVesselByImoAsync(""));
    }

    [Fact]
    public async Task GetVesselByImoAsync_NonExisting_ReturnsNull()
    {
        _mockRepository.Setup(r => r.GetByImoAsync(It.IsAny<ImoNumber>()))
            .ReturnsAsync((Vessel?)null);

        var result = await _service.GetVesselByImoAsync("1234567");
        Assert.Null(result);
    }

    #endregion

    #region SearchVesselsAsync Tests

    [Fact]
    public async Task SearchVesselsAsync_ReturnsMatching()
    {
        var list = new List<Vessel>
        {
            Vessel.Create("1234567", "Evergreen", "1001", "Op"),
            Vessel.Create("1111117", "Maersk", "1001", "Op")
        };

        _mockRepository.Setup(r => r.SearchByCriteriaAsync(It.IsAny<string?>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .ReturnsAsync(list);

        var result = await _service.SearchVesselsAsync(null, null, null);
        var arr = result.ToList();
        Assert.Equal(2, arr.Count);
    }

    #endregion

    #region DeleteVesselAsync Tests

    [Fact]
    public async Task DeleteVesselAsync_Existing_DeletesSuccessfully()
    {
        var vessel = Vessel.Create("1234567", "Name", "1001", "Op");
        _mockRepository.Setup(r => r.GetByImoAsync(It.IsAny<ImoNumber>()))
            .ReturnsAsync(vessel);
        _mockRepository.Setup(r => r.DeleteAsync(It.IsAny<Vessel>()))
            .Returns(Task.CompletedTask);

        await _service.DeleteVesselAsync("1234567");

        _mockRepository.Verify(r => r.DeleteAsync(It.Is<Vessel>(v => v.ImoNumber.Value == "1234567")), Times.Once);
    }

    [Fact]
    public async Task DeleteVesselAsync_NonExisting_ThrowsKeyNotFoundException()
    {
        _mockRepository.Setup(r => r.GetByImoAsync(It.IsAny<ImoNumber>()))
            .ReturnsAsync((Vessel?)null);

        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.DeleteVesselAsync("1234567"));
        Assert.Contains("not found", ex.Message);
    }

    [Fact]
    public async Task DeleteVesselAsync_EmptyImo_ThrowsArgumentException()
    {
        await Assert.ThrowsAsync<ArgumentException>(() => _service.DeleteVesselAsync("   "));
    }

    #endregion
}

