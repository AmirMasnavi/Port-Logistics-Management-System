using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Application.ShippingAgentsOrganization.Services;
using PortProject.Api.Application.ShippingAgentsRepresentative.Services;
using PortProject.Api.Controllers;

namespace PortProject.Api.Tests.Controllers
{
    [TestClass]
    public class ShippingAgentRepresentativesControllerTests
    {
        private Mock<IShippingAgentRepresentativeService> _repServiceMock = null!;
        private Mock<IShippingAgentOrganizationService> _orgServiceMock = null!;
        private ShippingAgentRepresentativesController _controller = null!;

        [TestInitialize]
        public void Setup()
        {
            _repServiceMock = new Mock<IShippingAgentRepresentativeService>(MockBehavior.Strict);
            _orgServiceMock = new Mock<IShippingAgentOrganizationService>(MockBehavior.Strict);
            _controller = new ShippingAgentRepresentativesController(_repServiceMock.Object, _orgServiceMock.Object);
        }

        // ---------- POST CreateRepresentative ----------

        [TestMethod]
        public async Task CreateRepresentative_WithValidDto_ShouldReturnCreatedAtAction()
        {
            // Arrange
            var dto = new CreateShippingAgentRepresentativeDto
            {
                OrganizationId = Guid.NewGuid().ToString(),
                CitizenId = "12345678Z",
                RepresentativeName = "Ana Silva",
                RepresentativeEmail = "ana@example.com",
                RepresentativePhone = "912345678",
                RepresentativeNationality = "PT"
            };

            var expected = new ShippingAgentRepresentativeDto
            {
                RepresentativeId = Guid.NewGuid().ToString(),
                RepresentativeName = dto.RepresentativeName,
                RepresentativeEmail = dto.RepresentativeEmail
            };

            _orgServiceMock
                .Setup(s => s.AddRepresentativeToOrganizationAsync(dto.OrganizationId, dto))
                .ReturnsAsync(expected);

            // Act
            var result = await _controller.CreateRepresentative(dto);

            // Assert
            var created = result.Result as CreatedAtActionResult;
            Assert.IsNotNull(created, "Deve retornar CreatedAtActionResult.");
            Assert.AreEqual(nameof(ShippingAgentRepresentativesController.GetRepresentativeById), created!.ActionName);
            Assert.AreEqual(expected, created.Value);
            Assert.IsTrue(created.RouteValues!.ContainsKey("id"));
            Assert.AreEqual(expected.RepresentativeId, created.RouteValues["id"]);

            _orgServiceMock.Verify(s => s.AddRepresentativeToOrganizationAsync(dto.OrganizationId, dto), Times.Once);
        }


        // ---------- PUT UpdateRepresentative ----------

        [TestMethod]
        public async Task UpdateRepresentative_WhenFound_ShouldReturnOkWithUpdatedDto()
        {
            // Arrange
            var id = Guid.NewGuid().ToString();
            var dto = new CreateShippingAgentRepresentativeDto { RepresentativeName = "Ana" };

            var updated = new ShippingAgentRepresentativeDto
            {
                RepresentativeId = id,
                RepresentativeName = "Ana Updated"
            };

            _repServiceMock
                .Setup(s => s.UpdateRepresentativeAsync(id, dto))
                .ReturnsAsync(updated);

            // Act
            var result = await _controller.UpdateRepresentative(id, dto);

            // Assert
            var ok = result.Result as OkObjectResult;
            Assert.IsNotNull(ok);
            Assert.AreSame(updated, ok!.Value);

            _repServiceMock.Verify(s => s.UpdateRepresentativeAsync(id, dto), Times.Once);
        }

        [TestMethod]
        public async Task UpdateRepresentative_WhenNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var id = Guid.NewGuid().ToString();
            var dto = new CreateShippingAgentRepresentativeDto();

            _repServiceMock
                .Setup(s => s.UpdateRepresentativeAsync(id, dto))
                .ReturnsAsync((ShippingAgentRepresentativeDto)null);

            // Act
            var result = await _controller.UpdateRepresentative(id, dto);

            // Assert
            var nf = result.Result as NotFoundObjectResult;
            Assert.IsNotNull(nf);
            StringAssert.Contains((string)nf!.Value!, id);

            _repServiceMock.Verify(s => s.UpdateRepresentativeAsync(id, dto), Times.Once);
        }

        // ---------- DELETE DeleteRepresentative ----------

        [TestMethod]
        public async Task DeleteRepresentative_WhenFound_ShouldReturnNoContent()
        {
            // Arrange
            var id = Guid.NewGuid().ToString();

            _repServiceMock
                .Setup(s => s.DeleteRepresentativeAsync(id))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.DeleteRepresentative(id);

            // Assert
            Assert.IsInstanceOfType(result, typeof(NoContentResult));

            _repServiceMock.Verify(s => s.DeleteRepresentativeAsync(id), Times.Once);
        }

        [TestMethod]
        public async Task DeleteRepresentative_WhenNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var id = Guid.NewGuid().ToString();

            _repServiceMock
                .Setup(s => s.DeleteRepresentativeAsync(id))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.DeleteRepresentative(id);

            // Assert
            var nf = result as NotFoundObjectResult;
            Assert.IsNotNull(nf);
            StringAssert.Contains((string)nf!.Value!, id);

            _repServiceMock.Verify(s => s.DeleteRepresentativeAsync(id), Times.Once);
        }

        // ---------- GET GetRepresentativeById ----------

        [TestMethod]
        public async Task GetRepresentativeById_WhenFound_ShouldReturnOk()
        {
            var id = Guid.NewGuid().ToString();
            var dto = new ShippingAgentRepresentativeDto { RepresentativeId = id, RepresentativeName = "Maria" };

            _repServiceMock
                .Setup(s => s.GetByIdAsync(id))
                .ReturnsAsync(dto);

            var result = await _controller.GetRepresentativeById(id);

            var ok = result.Result as OkObjectResult;
            Assert.IsNotNull(ok);
            Assert.AreSame(dto, ok!.Value);

            _repServiceMock.Verify(s => s.GetByIdAsync(id), Times.Once);
        }

        [TestMethod]
        public async Task GetRepresentativeById_WhenNotFound_ShouldReturnNotFound()
        {
            var id = Guid.NewGuid().ToString();

            _repServiceMock
                .Setup(s => s.GetByIdAsync(id))
                .ReturnsAsync((ShippingAgentRepresentativeDto)null);

            var result = await _controller.GetRepresentativeById(id);

            var nf = result.Result as NotFoundObjectResult;
            Assert.IsNotNull(nf);
            StringAssert.Contains((string)nf!.Value!, id);

            _repServiceMock.Verify(s => s.GetByIdAsync(id), Times.Once);
        }

        // ---------- GET GetAllRepresentatives ----------

        [TestMethod]
        public async Task GetAllRepresentatives_ShouldReturnOkWithList()
        {
            var list = new List<ShippingAgentRepresentativeDto>
            {
                new ShippingAgentRepresentativeDto { RepresentativeId = Guid.NewGuid().ToString(), RepresentativeName = "A" },
                new ShippingAgentRepresentativeDto { RepresentativeId = Guid.NewGuid().ToString(), RepresentativeName = "B" }
            };

            _repServiceMock
                .Setup(s => s.GetAllAsync())
                .ReturnsAsync(list);

            var result = await _controller.GetAllRepresentatives();

            var ok = result.Result as OkObjectResult;
            Assert.IsNotNull(ok);
            Assert.AreSame(list, ok!.Value);

            _repServiceMock.Verify(s => s.GetAllAsync(), Times.Once);
        }

        // ---------- GET GetRepresentativesByOrganizationId ----------

        [TestMethod]
        public async Task GetRepresentativesByOrganizationId_ShouldReturnOkWithList()
        {
            var orgId = Guid.NewGuid().ToString();
            var list = new List<ShippingAgentRepresentativeDto>
            {
                new ShippingAgentRepresentativeDto { RepresentativeId = "1", RepresentativeName = "A" }
            };

            _repServiceMock
                .Setup(s => s.GetByOrganizationIdAsync(orgId))
                .ReturnsAsync(list);

            var result = await _controller.GetRepresentativesByOrganizationId(orgId);

            var ok = result.Result as OkObjectResult;
            Assert.IsNotNull(ok);
            Assert.AreSame(list, ok!.Value);

            _repServiceMock.Verify(s => s.GetByOrganizationIdAsync(orgId), Times.Once);
        }
    }
}
