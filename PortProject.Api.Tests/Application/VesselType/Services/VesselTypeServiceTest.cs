using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using PortProject.Api.Domain.VesselTypeAggregate;
using PortProject.Api.Services;
using src.Domain.VesselTypeAggregate;
using src.Dto;
using Xunit;

namespace PortProject.Api.Tests.Services;

public class VesselTypeServiceTests
{
    private readonly Mock<IVesselTypeRepository> _mockRepository;
    private readonly VesselTypeService _service;

    public VesselTypeServiceTests()
    {
        _mockRepository = new Mock<IVesselTypeRepository>();
        _service = new VesselTypeService(_mockRepository.Object);
    }

    #region CreateVesselTypeAsync Tests

    [Fact]
    public async Task CreateVesselTypeAsync_ValidDto_ReturnsCreatedDto()
    {
        // Arrange
        var dto = new VesselTypeDto
        {
            Id = "1",
            Name = "Container Ship",
            Description = "Large cargo vessel",
            Capacity = 10000,
            MaxRows = 20,
            MaxBays = 15,
            MaxTiers = 10
        };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<VesselType>()))
            .ReturnsAsync((VesselType vt) => vt);

        // Act
        var result = await _service.CreateVesselTypeAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("1", result.Id);
        Assert.Equal("Container Ship", result.Name);
        Assert.Equal("Large cargo vessel", result.Description);
        Assert.Equal(10000, result.Capacity);
        Assert.Equal(20, result.MaxRows);
        Assert.Equal(15, result.MaxBays);
        Assert.Equal(10, result.MaxTiers);

        _mockRepository.Verify(r => r.AddAsync(It.IsAny<VesselType>()), Times.Once);
    }

    [Fact]
    public async Task CreateVesselTypeAsync_WithoutDescription_CreatesWithEmptyDescription()
    {
        // Arrange
        var dto = new VesselTypeDto
        {
            Id = "2",
            Name = "Tanker",
            Description = null,
            Capacity = 5000,
            MaxRows = 10,
            MaxBays = 8,
            MaxTiers = 5
        };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<VesselType>()))
            .ReturnsAsync((VesselType vt) => vt);

        // Act
        var result = await _service.CreateVesselTypeAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(string.Empty, result.Description);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<VesselType>()), Times.Once);
    }

    [Fact]
    public async Task CreateVesselTypeAsync_NullDto_ThrowsArgumentNullException()
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentNullException>(
            () => _service.CreateVesselTypeAsync(null));
        
        Assert.Equal("dto", ex.ParamName);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<VesselType>()), Times.Never);
    }

    [Fact]
    public async Task CreateVesselTypeAsync_EmptyId_ThrowsArgumentException()
    {
        // Arrange
        var dto = new VesselTypeDto
        {
            Id = "",
            Name = "Test",
            Capacity = 1000,
            MaxRows = 5,
            MaxBays = 5,
            MaxTiers = 5
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.CreateVesselTypeAsync(dto));
        
        Assert.Contains("Id é obrigatório", ex.Message);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<VesselType>()), Times.Never);
    }

    [Fact]
    public async Task CreateVesselTypeAsync_WhitespaceId_ThrowsArgumentException()
    {
        // Arrange
        var dto = new VesselTypeDto
        {
            Id = "   ",
            Name = "Test",
            Capacity = 1000,
            MaxRows = 5,
            MaxBays = 5,
            MaxTiers = 5
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.CreateVesselTypeAsync(dto));
        
        Assert.Contains("Id é obrigatório", ex.Message);
    }

    [Fact]
    public async Task CreateVesselTypeAsync_EmptyName_ThrowsArgumentException()
    {
        // Arrange
        var dto = new VesselTypeDto
        {
            Id = "3",
            Name = "",
            Capacity = 1000,
            MaxRows = 5,
            MaxBays = 5,
            MaxTiers = 5
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.CreateVesselTypeAsync(dto));
        
        Assert.Contains("Name é obrigatório", ex.Message);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<VesselType>()), Times.Never);
    }

    [Fact]
    public async Task CreateVesselTypeAsync_WhitespaceName_ThrowsArgumentException()
    {
        // Arrange
        var dto = new VesselTypeDto
        {
            Id = "3",
            Name = "   ",
            Capacity = 1000,
            MaxRows = 5,
            MaxBays = 5,
            MaxTiers = 5
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.CreateVesselTypeAsync(dto));
        
        Assert.Contains("Name é obrigatório", ex.Message);
    }

    [Fact]
    public async Task CreateVesselTypeAsync_TrimsIdAndName()
    {
        // Arrange
        var dto = new VesselTypeDto
        {
            Id = "  4  ",
            Name = "  Cargo Ship  ",
            Description = "  Description  ",
            Capacity = 1000,
            MaxRows = 5,
            MaxBays = 5,
            MaxTiers = 5
        };

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<VesselType>()))
            .ReturnsAsync((VesselType vt) => vt);

        // Act
        var result = await _service.CreateVesselTypeAsync(dto);

        // Assert
        Assert.Equal("4", result.Id);
        Assert.Equal("Cargo Ship", result.Name);
        Assert.Equal("Description", result.Description);
    }

    #endregion

    #region UpdateVesselTypeAsync Tests

    [Fact]
    public async Task UpdateVesselTypeAsync_ValidDto_ReturnsUpdatedDto()
    {
        // Arrange
        var existingVesselType = VesselType.Create("1", "Old Name", "Old Description", 5000, 10, 8, 5);
        
        var dto = new VesselTypeDto
        {
            Id = "1",
            Name = "Updated Name",
            Description = "Updated Description",
            Capacity = 15000,
            MaxRows = 25,
            MaxBays = 20,
            MaxTiers = 12
        };

        _mockRepository.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
            .ReturnsAsync(existingVesselType);
        
        _mockRepository.Setup(r => r.GetByNameAsync(It.IsAny<VesselTypeName>()))
            .ReturnsAsync((VesselType)null);

        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<VesselType>()))
            .ReturnsAsync((VesselType vt) => vt);

        // Act
        var result = await _service.UpdateVesselTypeAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("1", result.Id);
        Assert.Equal("Updated Name", result.Name);
        Assert.Equal("Updated Description", result.Description);
        Assert.Equal(15000, result.Capacity);
        Assert.Equal(25, result.MaxRows);
        Assert.Equal(20, result.MaxBays);
        Assert.Equal(12, result.MaxTiers);

        _mockRepository.Verify(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()), Times.Once);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<VesselType>()), Times.Once);
    }

    [Fact]
    public async Task UpdateVesselTypeAsync_NullDto_ThrowsArgumentNullException()
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentNullException>(
            () => _service.UpdateVesselTypeAsync(null));
        
        Assert.Equal("dto", ex.ParamName);
    }

    [Fact]
    public async Task UpdateVesselTypeAsync_EmptyId_ThrowsArgumentException()
    {
        // Arrange
        var dto = new VesselTypeDto
        {
            Id = "",
            Name = "Test",
            Capacity = 1000,
            MaxRows = 5,
            MaxBays = 5,
            MaxTiers = 5
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.UpdateVesselTypeAsync(dto));
        
        Assert.Contains("VesselType ID is required", ex.Message);
    }

    [Fact]
    public async Task UpdateVesselTypeAsync_NonExistentId_ThrowsKeyNotFoundException()
    {
        // Arrange
        var dto = new VesselTypeDto
        {
            Id = "999",
            Name = "Test",
            Capacity = 1000,
            MaxRows = 5,
            MaxBays = 5,
            MaxTiers = 5
        };

        _mockRepository.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
            .ReturnsAsync((VesselType)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _service.UpdateVesselTypeAsync(dto));
        
        Assert.Contains("Vessel Type with ID '999' not found", ex.Message);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<VesselType>()), Times.Never);
    }

    [Fact]
    public async Task UpdateVesselTypeAsync_DuplicateName_ThrowsInvalidOperationException()
    {
        // Arrange
        var existingVesselType1 = VesselType.Create("1", "Name1", "Desc1", 5000, 10, 8, 5);
        var existingVesselType2 = VesselType.Create("2", "Name2", "Desc2", 3000, 8, 6, 4);
        
        var dto = new VesselTypeDto
        {
            Id = "1",
            Name = "Name2", // Tentando usar o nome do VesselType com ID 2
            Description = "Updated Description",
            Capacity = 15000,
            MaxRows = 25,
            MaxBays = 20,
            MaxTiers = 12
        };

        _mockRepository.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
            .ReturnsAsync(existingVesselType1);
        
        _mockRepository.Setup(r => r.GetByNameAsync(It.IsAny<VesselTypeName>()))
            .ReturnsAsync(existingVesselType2); // Já existe outro com esse nome

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.UpdateVesselTypeAsync(dto));
        
        Assert.Contains("Vessel Type with name 'Name2' already exists", ex.Message);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<VesselType>()), Times.Never);
    }

    [Fact]
    public async Task UpdateVesselTypeAsync_SameNameSameId_UpdatesSuccessfully()
    {
        // Arrange
        var existingVesselType = VesselType.Create("1", "Name1", "Desc1", 5000, 10, 8, 5);
        
        var dto = new VesselTypeDto
        {
            Id = "1",
            Name = "Name1", // Mesmo nome, mesmo ID - deve permitir
            Description = "Updated Description",
            Capacity = 15000,
            MaxRows = 25,
            MaxBays = 20,
            MaxTiers = 12
        };

        _mockRepository.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
            .ReturnsAsync(existingVesselType);
        
        _mockRepository.Setup(r => r.GetByNameAsync(It.IsAny<VesselTypeName>()))
            .ReturnsAsync(existingVesselType); // Retorna o mesmo VesselType

        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<VesselType>()))
            .ReturnsAsync((VesselType vt) => vt);

        // Act
        var result = await _service.UpdateVesselTypeAsync(dto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("1", result.Id);
        Assert.Equal("Name1", result.Name);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<VesselType>()), Times.Once);
    }

    #endregion

    #region GetVesselTypeByIdAsync Tests

    [Fact]
    public async Task GetVesselTypeByIdAsync_ExistingId_ReturnsDto()
    {
        // Arrange
        var vesselType = VesselType.Create("1", "Container Ship", "Large vessel", 10000, 20, 15, 10);
        
        _mockRepository.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
            .ReturnsAsync(vesselType);

        // Act
        var result = await _service.GetVesselTypeByIdAsync("1");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("1", result.Id);
        Assert.Equal("Container Ship", result.Name);
        Assert.Equal("Large vessel", result.Description);
        Assert.Equal(10000, result.Capacity);

        _mockRepository.Verify(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()), Times.Once);
    }

    [Fact]
    public async Task GetVesselTypeByIdAsync_NonExistentId_ReturnsNull()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
            .ReturnsAsync((VesselType)null);

        // Act
        var result = await _service.GetVesselTypeByIdAsync("999");

        // Assert
        Assert.Null(result);
        _mockRepository.Verify(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()), Times.Once);
    }

    [Fact]
    public async Task GetVesselTypeByIdAsync_EmptyId_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.GetVesselTypeByIdAsync(""));
        
        Assert.Contains("VesselType ID cannot be null or empty", ex.Message);
        _mockRepository.Verify(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()), Times.Never);
    }

    [Fact]
    public async Task GetVesselTypeByIdAsync_WhitespaceId_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.GetVesselTypeByIdAsync("   "));
        
        Assert.Contains("VesselType ID cannot be null or empty", ex.Message);
    }

    #endregion

    #region GetAllVesselTypesAsync Tests

    [Fact]
    public async Task GetAllVesselTypesAsync_ReturnsAllVesselTypes()
    {
        // Arrange
        var vesselTypes = new List<VesselType>
        {
            VesselType.Create("1", "Container Ship", "Desc1", 10000, 20, 15, 10),
            VesselType.Create("2", "Tanker", "Desc2", 50000, 10, 8, 5),
            VesselType.Create("3", "Bulk Carrier", "Desc3", 30000, 15, 12, 8)
        };

        _mockRepository.Setup(r => r.GetAllAsync())
            .ReturnsAsync(vesselTypes);

        // Act
        var result = await _service.GetAllVesselTypesAsync();

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Equal(3, resultList.Count);
        Assert.Equal("Container Ship", resultList[0].Name);
        Assert.Equal("Tanker", resultList[1].Name);
        Assert.Equal("Bulk Carrier", resultList[2].Name);

        _mockRepository.Verify(r => r.GetAllAsync(), Times.Once);
    }

    [Fact]
    public async Task GetAllVesselTypesAsync_EmptyList_ReturnsEmptyCollection()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<VesselType>());

        // Act
        var result = await _service.GetAllVesselTypesAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        _mockRepository.Verify(r => r.GetAllAsync(), Times.Once);
    }

    #endregion

    #region SearchVesselTypesAsync Tests

    [Fact]
    public async Task SearchVesselTypesAsync_WithSearchTerm_ReturnsMatchingVesselTypes()
    {
        // Arrange
        var vesselTypes = new List<VesselType>
        {
            VesselType.Create("1", "Container Ship", "Large cargo vessel", 10000, 20, 15, 10),
            VesselType.Create("2", "Container Carrier", "Medium cargo vessel", 5000, 15, 10, 8)
        };

        _mockRepository.Setup(r => r.SearchByCriteriaAsync("container"))
            .ReturnsAsync(vesselTypes);

        // Act
        var result = await _service.SearchVesselTypesAsync("container");

        // Assert
        Assert.NotNull(result);
        var resultList = result.ToList();
        Assert.Equal(2, resultList.Count);
        Assert.All(resultList, vt => Assert.Contains("Container", vt.Name));

        _mockRepository.Verify(r => r.SearchByCriteriaAsync("container"), Times.Once);
    }

    [Fact]
    public async Task SearchVesselTypesAsync_WithNullSearchTerm_ReturnsAll()
    {
        // Arrange
        var vesselTypes = new List<VesselType>
        {
            VesselType.Create("1", "Container Ship", "Desc1", 10000, 20, 15, 10),
            VesselType.Create("2", "Tanker", "Desc2", 50000, 10, 8, 5)
        };

        _mockRepository.Setup(r => r.SearchByCriteriaAsync(null))
            .ReturnsAsync(vesselTypes);

        // Act
        var result = await _service.SearchVesselTypesAsync(null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
        _mockRepository.Verify(r => r.SearchByCriteriaAsync(null), Times.Once);
    }

    [Fact]
    public async Task SearchVesselTypesAsync_NoMatches_ReturnsEmptyCollection()
    {
        // Arrange
        _mockRepository.Setup(r => r.SearchByCriteriaAsync("nonexistent"))
            .ReturnsAsync(new List<VesselType>());

        // Act
        var result = await _service.SearchVesselTypesAsync("nonexistent");

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
        _mockRepository.Verify(r => r.SearchByCriteriaAsync("nonexistent"), Times.Once);
    }

    #endregion

    #region DeleteVesselTypeAsync Tests

    [Fact]
    public async Task DeleteVesselTypeAsync_ExistingId_DeletesSuccessfully()
    {
        // Arrange
        var vesselType = VesselType.Create("1", "Container Ship", "Desc", 10000, 20, 15, 10);
        
        _mockRepository.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
            .ReturnsAsync(vesselType);
        
        _mockRepository.Setup(r => r.DeleteAsync(It.IsAny<VesselType>()))
            .Returns(Task.CompletedTask);

        // Act
        await _service.DeleteVesselTypeAsync("1");

        // Assert
        _mockRepository.Verify(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()), Times.Once);
        _mockRepository.Verify(r => r.DeleteAsync(It.Is<VesselType>(vt => vt.Id.Value == "1")), Times.Once);
    }

    [Fact]
    public async Task DeleteVesselTypeAsync_NonExistentId_ThrowsKeyNotFoundException()
    {
        // Arrange
        _mockRepository.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
            .ReturnsAsync((VesselType)null);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _service.DeleteVesselTypeAsync("999"));
        
        Assert.Contains("Vessel Type with ID '999' not found", ex.Message);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<VesselType>()), Times.Never);
    }

    [Fact]
    public async Task DeleteVesselTypeAsync_EmptyId_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.DeleteVesselTypeAsync(""));
        
        Assert.Contains("VesselType ID cannot be null or empty", ex.Message);
        _mockRepository.Verify(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()), Times.Never);
        _mockRepository.Verify(r => r.DeleteAsync(It.IsAny<VesselType>()), Times.Never);
    }

    [Fact]
    public async Task DeleteVesselTypeAsync_WhitespaceId_ThrowsArgumentException()
    {
        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.DeleteVesselTypeAsync("   "));
        
        Assert.Contains("VesselType ID cannot be null or empty", ex.Message);
    }

    #endregion

    #region ToDto Private Method Tests (via Public Methods)

    [Fact]
    public async Task ToDto_ConvertsVesselTypeToDto_Correctly()
    {
        // Arrange
        var vesselType = VesselType.Create(
            "123", 
            "Test Vessel", 
            "Test Description", 
            5000, 
            10, 
            8, 
            6
        );

        _mockRepository.Setup(r => r.GetByIdAsync(It.IsAny<VesselTypeId>()))
            .ReturnsAsync(vesselType);

        // Act
        var result = await _service.GetVesselTypeByIdAsync("123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("123", result.Id);
        Assert.Equal("Test Vessel", result.Name);
        Assert.Equal("Test Description", result.Description);
        Assert.Equal(5000, result.Capacity);
        Assert.Equal(10, result.MaxRows);
        Assert.Equal(8, result.MaxBays);
        Assert.Equal(6, result.MaxTiers);
    }

    #endregion
}