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
                OrganizationName = "Test Organization",
                CitizenId = "12345678Z",
                RepresentativeName = "Ana Silva",
                RepresentativeEmail = "ana@example.com",
                RepresentativePhone = "912345678",
                RepresentativeNationality = "PT"
            };

            var mockRepresentative = new PortProject.Api.Domain.ShippingAgentRepresentativeAggregate.ShippingAgentRepresentative(
                new PortProject.Api.Domain.ShippingAgentRepresentativeAggregate.CitizenId(dto.CitizenId),
                new PortProject.Api.Domain.ShippingAgentRepresentativeAggregate.RepresentativeName(dto.RepresentativeName),
                new PortProject.Api.Domain.ShippingAgentRepresentativeAggregate.RepresentativePhone(dto.RepresentativePhone),
                new PortProject.Api.Domain.ShippingAgentRepresentativeAggregate.RepresentativeNationality(dto.RepresentativeNationality),
                new PortProject.Api.Domain.ShippingAgentRepresentativeAggregate.RepresentativeEmail(dto.RepresentativeEmail)
            );
            
            // Attach to organization
            mockRepresentative.AttachToOrganization(new PortProject.Api.Domain.ShippingAgentOrganizationAggregate.OrganizationId(Guid.NewGuid()));

            _repServiceMock
                .Setup(s => s.CreateRepresentativeAsync(It.IsAny<CreateShippingAgentRepresentativeDto>()))
                .ReturnsAsync(mockRepresentative);

            // Act
            var result = await _controller.CreateRepresentative(dto);

            // Assert
            var created = result.Result as CreatedAtActionResult;
            Assert.IsNotNull(created, "Should return CreatedAtActionResult.");
            Assert.AreEqual(nameof(ShippingAgentRepresentativesController.GetRepresentativeById), created!.ActionName);
            Assert.IsTrue(created.RouteValues!.ContainsKey("id"));
            
            var createdDto = created.Value as ShippingAgentRepresentativeDto;
            Assert.IsNotNull(createdDto);
            Assert.AreEqual(dto.CitizenId, createdDto!.CitizenId);
            Assert.AreEqual(dto.RepresentativeName, createdDto.RepresentativeName);
            Assert.AreEqual(dto.RepresentativeEmail, createdDto.RepresentativeEmail);
        }

        [TestMethod]
        public async Task CreateRepresentative_WithoutOrganizationName_ShouldReturnBadRequest()
        {
            // Arrange
            var dto = new CreateShippingAgentRepresentativeDto
            {
                CitizenId = "12345678Z",
                RepresentativeName = "Ana Silva",
                RepresentativeEmail = "ana@example.com",
                RepresentativePhone = "912345678",
                RepresentativeNationality = "PT"
                // Missing OrganizationName
            };

            // Act
            var result = await _controller.CreateRepresentative(dto);

            // Assert
            var badRequest = result.Result as BadRequestObjectResult;
            Assert.IsNotNull(badRequest, "Should return BadRequest when OrganizationName is missing.");
        }

        [TestMethod]
        public async Task CreateRepresentative_DuplicateEmail_ShouldReturnConflict()
        {
            // Arrange
            var dto = new CreateShippingAgentRepresentativeDto
            {
                OrganizationName = "Test Organization",
                CitizenId = "12345678Z",
                RepresentativeName = "Ana Silva",
                RepresentativeEmail = "ana@example.com",
                RepresentativePhone = "912345678",
                RepresentativeNationality = "PT"
            };
            _repServiceMock.Setup(s => s.CreateRepresentativeAsync(It.IsAny<CreateShippingAgentRepresentativeDto>()))
                .ThrowsAsync(new InvalidOperationException("Email 'ana@example.com' already exists."));

            // Act
            var result = await _controller.CreateRepresentative(dto);

            // Assert
            var conflict = result.Result as ConflictObjectResult;
            Assert.IsNotNull(conflict);
            var msgProp = conflict!.Value?.GetType().GetProperty("message");
            var message = msgProp?.GetValue(conflict.Value)?.ToString() ?? string.Empty;
            StringAssert.Contains(message, "already exists");
        }


        // ---------- PUT UpdateRepresentative ----------

        [TestMethod]
        public async Task UpdateRepresentative_WhenFound_ShouldReturnOkWithMessage()
        {
            // Arrange
            var citizenId = "12345678Z";
            var dto = new CreateShippingAgentRepresentativeDto 
            { 
                RepresentativeName = "Ana Updated",
                OrganizationName = "Test Org"
            };

            var updated = new ShippingAgentRepresentativeDto
            {
                CitizenId = citizenId,
                RepresentativeName = "Ana Updated"
            };

            _repServiceMock
                .Setup(s => s.UpdateRepresentativeByCitizenIdAsync(citizenId, dto))
                .ReturnsAsync(updated);

            // Act
            var result = await _controller.UpdateRepresentative(citizenId, dto);

            // Assert
            var ok = result.Result as OkObjectResult;
            Assert.IsNotNull(ok);
            Assert.IsInstanceOfType(ok!.Value, typeof(string));
            StringAssert.Contains((string)ok.Value!, citizenId);

            _repServiceMock.Verify(s => s.UpdateRepresentativeByCitizenIdAsync(citizenId, dto), Times.Once);
        }

        [TestMethod]
        public async Task UpdateRepresentative_WhenNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var citizenId = "NONEXISTENT";
            var dto = new CreateShippingAgentRepresentativeDto();

            _repServiceMock
                .Setup(s => s.UpdateRepresentativeByCitizenIdAsync(citizenId, dto))
                .ReturnsAsync((ShippingAgentRepresentativeDto)null);

            // Act
            var result = await _controller.UpdateRepresentative(citizenId, dto);

            // Assert
            var nf = result.Result as NotFoundObjectResult;
            Assert.IsNotNull(nf);
            StringAssert.Contains((string)nf!.Value!, citizenId);

            _repServiceMock.Verify(s => s.UpdateRepresentativeByCitizenIdAsync(citizenId, dto), Times.Once);
        }

        // ---------- DELETE DeleteRepresentative ----------

        [TestMethod]
        public async Task DeleteRepresentative_WhenFound_ShouldReturnOkWithMessage()
        {
            // Arrange
            var citizenId = "12345678Z";

            _repServiceMock
                .Setup(s => s.DeleteRepresentativeByCitizenIdAsync(citizenId))
                .ReturnsAsync(true);

            // Act
            var result = await _controller.DeleteRepresentative(citizenId);

            // Assert
            var ok = result as OkObjectResult;
            Assert.IsNotNull(ok);
            Assert.IsInstanceOfType(ok!.Value, typeof(string));
            StringAssert.Contains((string)ok.Value!, citizenId);

            _repServiceMock.Verify(s => s.DeleteRepresentativeByCitizenIdAsync(citizenId), Times.Once);
        }

        [TestMethod]
        public async Task DeleteRepresentative_WhenNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var citizenId = "NONEXISTENT";

            _repServiceMock
                .Setup(s => s.DeleteRepresentativeByCitizenIdAsync(citizenId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.DeleteRepresentative(citizenId);

            // Assert
            var nf = result as NotFoundObjectResult;
            Assert.IsNotNull(nf);
            StringAssert.Contains((string)nf!.Value!, citizenId);

            _repServiceMock.Verify(s => s.DeleteRepresentativeByCitizenIdAsync(citizenId), Times.Once);
        }

        // ---------- GET GetRepresentativeById ----------

        [TestMethod]
        public async Task GetRepresentativeById_WhenFound_ShouldReturnOk()
        {
            var citizenId = "12345678Z";
            var dto = new ShippingAgentRepresentativeDto 
            { 
                RepresentativeId = Guid.NewGuid().ToString(), 
                CitizenId = citizenId,
                RepresentativeName = "Maria" 
            };

            _repServiceMock
                .Setup(s => s.GetByCitizenIdAsync(citizenId))
                .ReturnsAsync(dto);

            var result = await _controller.GetRepresentativeById(citizenId);

            var ok = result.Result as OkObjectResult;
            Assert.IsNotNull(ok);
            Assert.AreSame(dto, ok!.Value);

            _repServiceMock.Verify(s => s.GetByCitizenIdAsync(citizenId), Times.Once);
        }

        [TestMethod]
        public async Task GetRepresentativeById_WhenNotFound_ShouldReturnNotFound()
        {
            var citizenId = "NONEXISTENT";

            _repServiceMock
                .Setup(s => s.GetByCitizenIdAsync(citizenId))
                .ReturnsAsync((ShippingAgentRepresentativeDto)null);

            var result = await _controller.GetRepresentativeById(citizenId);

            var nf = result.Result as NotFoundObjectResult;
            Assert.IsNotNull(nf);
            StringAssert.Contains((string)nf!.Value!, citizenId);

            _repServiceMock.Verify(s => s.GetByCitizenIdAsync(citizenId), Times.Once);
        }

        // ---------- GET GetAllRepresentatives ----------

        [TestMethod]
        public async Task GetAllRepresentatives_ShouldReturnOkWithList()
        {
            var list = new List<RepresentativeSimpleDto>
            {
                new RepresentativeSimpleDto { Name = "A", CitizenId = "12345678A" },
                new RepresentativeSimpleDto { Name = "B", CitizenId = "12345678B" }
            };

            _repServiceMock
                .Setup(s => s.GetAllSimplifiedAsync())
                .ReturnsAsync(list);

            var result = await _controller.GetAllRepresentatives();

            var ok = result.Result as OkObjectResult;
            Assert.IsNotNull(ok);
            Assert.AreSame(list, ok!.Value);

            _repServiceMock.Verify(s => s.GetAllSimplifiedAsync(), Times.Once);
        }

        // ---------- GET GetRepresentativesByOrganizationId ----------

        [TestMethod]
        public async Task GetRepresentativesByOrganizationId_ShouldReturnOkWithList()
        {
            var orgId = Guid.NewGuid().ToString();
            var list = new List<RepresentativeSimpleDto>
            {
                new RepresentativeSimpleDto { Name = "A", CitizenId = "12345678A" }
            };

            _repServiceMock
                .Setup(s => s.GetSimplifiedByOrganizationIdAsync(orgId))
                .ReturnsAsync(list);

            var result = await _controller.GetRepresentativesByOrganizationId(orgId);

            var ok = result.Result as OkObjectResult;
            Assert.IsNotNull(ok);
            Assert.AreSame(list, ok!.Value);

            _repServiceMock.Verify(s => s.GetSimplifiedByOrganizationIdAsync(orgId), Times.Once);
        }
    }
}
