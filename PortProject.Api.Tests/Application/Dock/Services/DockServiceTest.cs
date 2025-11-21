using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using PortProject.Api.Application.Dock.DTOs;
using PortProject.Api.Application.Dock.Services;
using PortProject.Api.Domain.DockAggregate;
using PortProject.Api.Domain.VesselTypeAggregate;
using src.Domain.VesselTypeAggregate;
using Xunit;

namespace PortProject.Api.Tests.Application.Dock.Services
{
    public class DockServiceTests
    {
        private readonly Mock<IDockRepository> _mockDockRepository;
        private readonly Mock<IVesselTypeRepository> _mockVesselTypeRepository;
        private readonly DockService _service;

        public DockServiceTests()
        {
            _mockDockRepository = new Mock<IDockRepository>();
            _mockVesselTypeRepository = new Mock<IVesselTypeRepository>();
            _service = new DockService(_mockDockRepository.Object, _mockVesselTypeRepository.Object);
        }

        #region CreateDockAsync Tests

        [Fact]
        public async Task CreateDockAsync_NullDto_ThrowsArgumentNullException()
        {
            // Act & Assert
            var ex = await Assert.ThrowsAsync<ArgumentNullException>(() => _service.CreateDockAsync(null));
            Assert.Equal("dto", ex.ParamName);
            _mockDockRepository.Verify(r => r.AddAsync(It.IsAny<Api.Domain.DockAggregate.Dock>()), Times.Never);
        }

        [Fact]
        public async Task CreateDockAsync_NullAllowedVesselTypes_StillCreatesDock()
        {
            // Arrange
            var dto = new DockCreateDto
            {
                Name = "Dock Without VesselTypes",
                LocationZone = "B",
                LocationSection = "East",
                LengthInMeters = 250,
                DepthInMeters = 10,
                MaxDraftInMeters = 8,
                NumberOfSTSCranes = 2,
                AllowedVesselTypeIds = null
            };

            _mockVesselTypeRepository.Setup(r => r.GetByIdsAsync(It.IsAny<List<VesselTypeId>>()))
                .ReturnsAsync(new List<VesselType>());

            _mockDockRepository.Setup(r => r.AddAsync(It.IsAny<Api.Domain.DockAggregate.Dock>()))
                .ReturnsAsync((Api.Domain.DockAggregate.Dock d) => d);

            // Act
            var result = await _service.CreateDockAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result.AllowedVesselTypeIds);
        }

        #endregion

        #region UpdateDockAsync Tests

        [Fact]
        public async Task UpdateDockAsync_ValidDto_UpdatesSuccessfully()
        {
            // Arrange
            var existingDock = Api.Domain.DockAggregate.Dock.Create("D1", "Old Dock", "A", "North", 200, 12, 10, 3, new List<string> { "VT1" });

            var dto = new DockDto
            {
                Id = "D1",
                Name = "Updated Dock",
                LocationZone = "B",
                LocationSection = "South",
                LengthInMeters = 350,
                DepthInMeters = 14,
                MaxDraftInMeters = 11,
                NumberOfSTSCranes = 5,
                AllowedVesselTypeIds = new List<string> { "VT2" }
            };

            var vesselTypes = new List<VesselType>
            {
                VesselType.Create("VT2", "Type2", "Desc2", 2000, 10, 10, 10)
            };

            _mockDockRepository.Setup(r => r.GetByIdAsync(It.IsAny<DockId>()))
                .ReturnsAsync(existingDock);

            _mockVesselTypeRepository.Setup(r => r.GetByIdsAsync(It.IsAny<List<VesselTypeId>>()))
                .ReturnsAsync(vesselTypes);

            _mockDockRepository.Setup(r => r.UpdateAsync(It.IsAny<Api.Domain.DockAggregate.Dock>()))
                .ReturnsAsync((Api.Domain.DockAggregate.Dock d) => d);

            // Act
            var result = await _service.UpdateDockAsync(dto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Updated Dock", result.Name);
            Assert.Equal("B", result.LocationZone);
            Assert.Equal("South", result.LocationSection);
            Assert.Equal(350, result.LengthInMeters);
            Assert.Equal(5, result.NumberOfSTSCranes);

            _mockDockRepository.Verify(r => r.UpdateAsync(It.IsAny<Api.Domain.DockAggregate.Dock>()), Times.Once);
        }

        [Fact]
        public async Task UpdateDockAsync_NullDto_ThrowsArgumentNullException()
        {
            await Assert.ThrowsAsync<ArgumentNullException>(() => _service.UpdateDockAsync(null));
        }

        [Fact]
        public async Task UpdateDockAsync_NonExistentId_ThrowsKeyNotFoundException()
        {
            // Arrange
            var dto = new DockDto { Id = "999", Name = "Test" };

            _mockDockRepository.Setup(r => r.GetByIdAsync(It.IsAny<DockId>()))
                .ReturnsAsync((Api.Domain.DockAggregate.Dock)null);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.UpdateDockAsync(dto));
            Assert.Contains("Dock with ID '999' not found", ex.Message);
        }

        #endregion

        #region GetDockByIdAsync Tests

        [Fact]
        public async Task GetDockByIdAsync_ExistingDock_ReturnsDto()
        {
            // Arrange
            var dock = Api.Domain.DockAggregate.Dock.Create("D1", "Main Dock", "A", "North", 300, 15, 12, 4, new List<string> { "VT1" });
            _mockDockRepository.Setup(r => r.GetByIdAsync(It.IsAny<DockId>())).ReturnsAsync(dock);

            // Act
            var result = await _service.GetDockByIdAsync("D1");

            // Assert
            Assert.NotNull(result);
            Assert.Equal("D1", result.Id);
            Assert.Equal("Main Dock", result.Name);
            Assert.Equal("A", result.LocationZone);
        }

        [Fact]
        public async Task GetDockByIdAsync_NonExistentId_ReturnsNull()
        {
            _mockDockRepository.Setup(r => r.GetByIdAsync(It.IsAny<DockId>())).ReturnsAsync((Api.Domain.DockAggregate.Dock)null);

            var result = await _service.GetDockByIdAsync("999");
            Assert.Null(result);
        }

        [Fact]
        public async Task GetDockByIdAsync_EmptyId_ThrowsArgumentException()
        {
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.GetDockByIdAsync(""));
            Assert.Contains("Dock ID cannot be null or empty", ex.Message);
        }

        #endregion

        #region GetAllDocksAsync Tests

        [Fact]
        public async Task GetAllDocksAsync_ReturnsAllDocks()
        {
            var docks = new List<Api.Domain.DockAggregate.Dock>
            {
                Api.Domain.DockAggregate.Dock.Create("1", "Dock1", "A", "Zone1", 100, 10, 8, 2, new List<string>()),
                Api.Domain.DockAggregate.Dock.Create("2", "Dock2", "B", "Zone2", 150, 12, 9, 3, new List<string>())
            };

            _mockDockRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(docks);

            var result = await _service.GetAllDocksAsync();

            Assert.Equal(2, result.Count());
            _mockDockRepository.Verify(r => r.GetAllAsync(), Times.Once);
        }

        [Fact]
        public async Task GetAllDocksAsync_EmptyList_ReturnsEmpty()
        {
            _mockDockRepository.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Api.Domain.DockAggregate.Dock>());

            var result = await _service.GetAllDocksAsync();

            Assert.Empty(result);
        }

        #endregion

        #region SearchDocksAsync Tests

        [Fact]
        public async Task SearchDocksAsync_ReturnsMatchingDocks()
        {
            var docks = new List<Api.Domain.DockAggregate.Dock>
            {
                Api.Domain.DockAggregate.Dock.Create("1", "DockA", "A", "N", 100, 10, 8, 2, new List<string>()),
                Api.Domain.DockAggregate.Dock.Create("2", "DockB", "A", "N", 100, 10, 8, 2, new List<string>())
            };

            _mockDockRepository.Setup(r => r.SearchByCriteriaAsync("Dock", null, null, null, 1, 10, null, null))
                .ReturnsAsync(docks);

            var result = await _service.SearchDocksAsync("Dock", null, null, null, 1, 10, null, null);

            Assert.Equal(2, result.Count());
            _mockDockRepository.Verify(r => r.SearchByCriteriaAsync("Dock", null, null, null, 1, 10, null, null), Times.Once);
        }

        [Fact]
        public async Task SearchDocksAsync_NoMatches_ReturnsEmptyCollection()
        {
            _mockDockRepository.Setup(r => r.SearchByCriteriaAsync("Nonexistent", null, null, null, 1, 10, null, null))
                .ReturnsAsync(new List<Api.Domain.DockAggregate.Dock>());

            var result = await _service.SearchDocksAsync("Nonexistent", null, null, null, 1, 10, null, null);

            Assert.Empty(result);
        }

        #endregion

        #region DeleteDockAsync Tests

        [Fact]
        public async Task DeleteDockAsync_ExistingDock_DeletesSuccessfully()
        {
            var dock = Api.Domain.DockAggregate.Dock.Create("1", "Main Dock", "A", "N", 100, 10, 8, 2, new List<string>());
            _mockDockRepository.Setup(r => r.GetByIdAsync(It.IsAny<DockId>())).ReturnsAsync(dock);

            _mockDockRepository.Setup(r => r.DeleteAsync(It.IsAny<Api.Domain.DockAggregate.Dock>())).Returns(Task.CompletedTask);

            await _service.DeleteDockAsync("1");

            _mockDockRepository.Verify(r => r.DeleteAsync(It.Is<Api.Domain.DockAggregate.Dock>(d => d.Id.Value == "1")), Times.Once);
        }

        [Fact]
        public async Task DeleteDockAsync_NonExistentId_ThrowsKeyNotFoundException()
        {
            _mockDockRepository.Setup(r => r.GetByIdAsync(It.IsAny<DockId>())).ReturnsAsync((Api.Domain.DockAggregate.Dock)null);

            var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.DeleteDockAsync("999"));
            Assert.Contains("Dock with ID '999' not found", ex.Message);
        }

        [Fact]
        public async Task DeleteDockAsync_EmptyId_ThrowsArgumentException()
        {
            var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.DeleteDockAsync(""));
            Assert.Contains("Dock ID cannot be null or empty", ex.Message);
        }

        #endregion
    }
}
