using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.Dock.DTOs;
using PortProject.Api.Application.Dock.Services;
using PortProject.Api.Controllers;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PortProject.Api.Tests.Controllers
{
    [TestClass]
    public class DockControllerTest
    {
        private readonly Mock<IDockService> _mockService;
        private readonly DockController _controller;

        public DockControllerTest()
        {
            _mockService = new Mock<IDockService>();
            _controller = new DockController(_mockService.Object);
        }

        // ===== POST: CreateDock =====

        [TestMethod]
        public async Task CreateDock_WithValidDto_ShouldReturnCreatedAtAction()
        {
            // Arrange
            var createDto = new DockCreateDto { Name = "Dock A" };
            var expectedDto = new DockDto { Id = "123", Name = "Dock A" };

            _mockService
                .Setup(s => s.CreateDockAsync(createDto))
                .ReturnsAsync(expectedDto);

            // Act
            var result = await _controller.CreateDock(createDto);

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(CreatedAtActionResult));
            var createdResult = (CreatedAtActionResult)result.Result;
            Assert.AreEqual(201, createdResult.StatusCode);
            Assert.AreEqual(expectedDto, createdResult.Value);
        }

        [TestMethod]
        public async Task CreateDock_WithNullBody_ShouldReturnBadRequest()
        {
            // Act
            var result = await _controller.CreateDock(null);

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(BadRequestObjectResult));
            var badRequest = (BadRequestObjectResult)result.Result;
            Assert.AreEqual(400, badRequest.StatusCode);
        }

        // ===== PUT: UpdateDock =====

        [TestMethod]
        public async Task UpdateDock_WithValidData_ShouldReturnOkResult()
        {
            // Arrange
            var id = "D1";
            var dto = new DockDto { Id = id, Name = "Dock Updated" };

            _mockService
                .Setup(s => s.UpdateDockAsync(dto))
                .ReturnsAsync(dto);

            // Act
            var result = await _controller.UpdateDock(id, dto);

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
            var okResult = (OkObjectResult)result.Result;
            Assert.AreEqual(200, okResult.StatusCode);
            Assert.AreEqual(dto, okResult.Value);
        }

        // ===== GET: GetDockById =====

        [TestMethod]
        public async Task GetDockById_WhenDockExists_ShouldReturnOk()
        {
            // Arrange
            var dockId = "D1";
            var expectedDock = new DockDto { Id = dockId, Name = "Dock 1" };

            _mockService
                .Setup(s => s.GetDockByIdAsync(dockId))
                .ReturnsAsync(expectedDock);

            // Act
            var result = await _controller.GetDockById(dockId);

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
            var okResult = (OkObjectResult)result.Result;
            Assert.AreEqual(expectedDock, okResult.Value);
        }

        [TestMethod]
        public async Task GetDockById_WhenDockDoesNotExist_ShouldReturnNotFound()
        {
            // Arrange
            var dockId = "D2";
            _mockService
                .Setup(s => s.GetDockByIdAsync(dockId))
                .ReturnsAsync((DockDto)null);

            // Act
            var result = await _controller.GetDockById(dockId);

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(NotFoundObjectResult));
            var notFound = (NotFoundObjectResult)result.Result;
            Assert.AreEqual(404, notFound.StatusCode);
        }

        // ===== GET: GetAllDocks =====

        [TestMethod]
        public async Task GetAllDocks_ShouldReturnListOfDocks()
        {
            // Arrange
            var docks = new List<DockDto>
            {
                new DockDto { Id = "1", Name = "Dock 1" },
                new DockDto { Id = "2", Name = "Dock 2" }
            };

            _mockService
                .Setup(s => s.GetAllDocksAsync())
                .ReturnsAsync(docks);

            // Act
            var result = await _controller.GetAllDocks();

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
            var okResult = (OkObjectResult)result.Result;
            Assert.AreEqual(docks, okResult.Value);
        }

        // ===== GET: SearchDock =====

        [TestMethod]
        public async Task SearchDock_WithFilters_ShouldReturnMatchingResults()
        {
            // Arrange
            var docks = new List<DockDto> { new DockDto { Id = "S1", Name = "SearchDock" } };

            _mockService
                .Setup(s => s.SearchDocksAsync("SearchDock", null, null, null, 1, 10, "name", "asc"))
                .ReturnsAsync(docks);

            // Act
            var result = await _controller.SearchDock("SearchDock", null, null, null, 1, 10, "name", "asc");

            // Assert
            Assert.IsInstanceOfType(result.Result, typeof(OkObjectResult));
            var okResult = (OkObjectResult)result.Result;
            Assert.AreEqual(docks, okResult.Value);
        }

        // ===== DELETE: DeleteDock =====

        [TestMethod]
        public async Task DeleteDock_ShouldReturnNoContent()
        {
            // Arrange
            var dockId = "D1";
            _mockService
                .Setup(s => s.DeleteDockAsync(dockId))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.DeleteDock(dockId);

            // Assert
            Assert.IsInstanceOfType(result, typeof(NoContentResult));
            var noContent = (NoContentResult)result;
            Assert.AreEqual(204, noContent.StatusCode);
        }
    }
}
