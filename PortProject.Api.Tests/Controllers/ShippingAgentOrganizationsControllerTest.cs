using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Application.ShippingAgentsOrganization.Services;
using PortProject.Api.Controllers;
using System.Threading;

namespace PortProject.Api.Tests.Controllers
{
    [TestClass]
    public class ShippingAgentOrganizationsControllerTests
    {
        private Mock<IShippingAgentOrganizationService> _serviceMock = null!;
        private ShippingAgentOrganizationsController _controller = null!;

        [TestInitialize]
        public void Setup()
        {
            _serviceMock = new Mock<IShippingAgentOrganizationService>(MockBehavior.Strict);
            _controller = new ShippingAgentOrganizationsController(_serviceMock.Object);
        }

        // ---------- POST CreateOrganization ----------

        [TestMethod]
        public async Task CreateOrganization_WithValidDto_ShouldReturnCreatedAtAction_WithNewGuid()
        {
            // Arrange
            var dto = new CreateShippingAgentOrganizationDto
            {
                LegalName = "ACME Shipping",
                TaxNumber = "123456789",
                Street = "Rua A, 123",
                City = "Porto",
                Country = "Portugal"
            };

            var newId = Guid.NewGuid();
            _serviceMock
                .Setup(s => s.RegisterOrganizationAsync(dto, It.IsAny<CancellationToken>()))
                .ReturnsAsync(newId);

            // Act
            var result = await _controller.CreateOrganization(dto);

            // Assert
            var created = result.Result as CreatedAtActionResult;
            Assert.IsNotNull(created, "Deve devolver CreatedAtActionResult.");
            Assert.AreEqual(nameof(ShippingAgentOrganizationsController.GetOrganizationById), created!.ActionName);
            Assert.IsNotNull(created.RouteValues);
            Assert.IsTrue(created.RouteValues!.TryGetValue("id", out var routeId));
            Assert.AreEqual(newId, (Guid)routeId!);
            Assert.AreEqual(newId, created.Value);

            _serviceMock.Verify(s => s.RegisterOrganizationAsync(dto, It.IsAny<CancellationToken>()), Times.Once);
        }

       

        // ---------- GET GetOrganizationById ----------

        [TestMethod]
        public async Task GetOrganizationById_WhenFound_ShouldReturnOkWithDto()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new ShippingAgentOrganizationDto
            {
                Id = id.ToString(),
                LegalName = "ACME Shipping",
                TaxNumber = "123456789",
                Street = "Rua A, 123",
                City = "Porto",
                Country = "Portugal"
            };

            _serviceMock
                .Setup(s => s.GetByIdAsync(id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(dto);

            // Act
            var result = await _controller.GetOrganizationById(id);

            // Assert
            var ok = result.Result as OkObjectResult;
            Assert.IsNotNull(ok, "Deve devolver OkObjectResult.");
            Assert.AreSame(dto, ok!.Value);

            _serviceMock.Verify(s => s.GetByIdAsync(id, It.IsAny<CancellationToken>()), Times.Once);
        }

        [TestMethod]
        public async Task GetOrganizationById_WhenNotFound_ShouldReturnNotFoundWithMessage()
        {
            // Arrange
            var id = Guid.NewGuid();

            _serviceMock
                .Setup(s => s.GetByIdAsync(id, It.IsAny<CancellationToken>()))
                .ReturnsAsync((ShippingAgentOrganizationDto?)null);

            // Act
            var result = await _controller.GetOrganizationById(id);

            // Assert
            var nf = result.Result as NotFoundObjectResult;
            Assert.IsNotNull(nf, "Deve devolver NotFoundObjectResult.");
            Assert.IsTrue(nf!.Value is string);
            StringAssert.Contains((string)nf.Value!, id.ToString());

            _serviceMock.Verify(s => s.GetByIdAsync(id, It.IsAny<CancellationToken>()), Times.Once);
        }

        // ---------- GET GetAllOrganizations ----------

        [TestMethod]
        public async Task GetAllOrganizations_ShouldReturnOkWithList()
        {
            // Arrange
            var list = new List<ShippingAgentOrganizationDto>
            {
                new ShippingAgentOrganizationDto { Id = Guid.NewGuid().ToString(), LegalName = "Org1", TaxNumber = "123456789", Street = "A", City = "X", Country = "PT" },
                new ShippingAgentOrganizationDto { Id = Guid.NewGuid().ToString(), LegalName = "Org2", TaxNumber = "987654321", Street = "B", City = "Y", Country = "PT" }
            };

            _serviceMock
                .Setup(s => s.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(list);

            // Act
            var result = await _controller.GetAllOrganizations();

            // Assert
            var ok = result.Result as OkObjectResult;
            Assert.IsNotNull(ok, "Deve devolver OkObjectResult.");
            Assert.AreSame(list, ok!.Value);

            _serviceMock.Verify(s => s.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
