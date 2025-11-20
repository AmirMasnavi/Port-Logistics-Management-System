using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Application.ShippingAgentsRepresentative.Services;
using PortProject.Api.Models;
using OrgAgg = PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using RepAgg = PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;

namespace PortProject.Api.Tests.Application.ShippingAgentRepresentative
{
    [TestClass]
    public class ShippingAgentRepresentativeServiceTest
    {
        private Mock<RepAgg.IShippingAgentRepresentativeRepository> _repoMock = null!;
        private Mock<OrgAgg.IShippingAgentOrganizationRepository> _orgRepoMock = null!;
        private Mock<PortProjectContext> _mockContext = null!;
        private ShippingAgentRepresentativeService _service = null!;

        [TestInitialize]
        public void Setup()
        {
            _repoMock = new Mock<RepAgg.IShippingAgentRepresentativeRepository>(MockBehavior.Strict);
            _orgRepoMock = new Mock<OrgAgg.IShippingAgentOrganizationRepository>(MockBehavior.Strict);
            _mockContext = new Mock<PortProjectContext>();
            _service = new ShippingAgentRepresentativeService(_repoMock.Object, _orgRepoMock.Object, _mockContext.Object);
        }

        private static CreateShippingAgentRepresentativeDto ValidCreateDto(string? orgName = "Test Org")
        {
            return new CreateShippingAgentRepresentativeDto
            {
                OrganizationName = orgName,
                CitizenId = "12345678Z",
                RepresentativeName = "Ana Silva",
                RepresentativeEmail = "ana.silva@example.com",
                RepresentativePhone = "912345678",
                RepresentativeNationality = "PT"
            };
        }

        private static RepAgg.ShippingAgentRepresentative BuildDomainRep(bool withOrg = false)
        {
            var rep = new RepAgg.ShippingAgentRepresentative(
                new RepAgg.CitizenId("12345678Z"),
                new RepAgg.RepresentativeName("Ana Silva"),
                new RepAgg.RepresentativePhone("912345678"),
                new RepAgg.RepresentativeNationality("PT"),
                new RepAgg.RepresentativeEmail("ana.silva@example.com")
            );
            if (withOrg)
            {
                rep.AttachToOrganization(OrgAgg.OrganizationId.NewId());
            }
            return rep;
        }

        // CreateRepresentativeAsync
        [TestMethod]
        public async Task CreateRepresentativeAsync_WithOrganizationName_ShouldAttachAndCallAdd()
        {
            // Arrange
            var dto = ValidCreateDto("Test Organization");
            var mockOrg = new OrgAgg.ShippingAgentOrganization(
                OrgAgg.OrganizationId.NewId(),
                new OrgAgg.LegalName("Test Organization"),
                new OrgAgg.AlternativeName("Alt Name"),
                new OrgAgg.Address("Street", "City", "Country"),
                new OrgAgg.TaxNumber("123456789"),
                "test@org.com",
                "912345678"
            );

            // Mock uniqueness checks
            _repoMock
                .Setup(r => r.ExistsByCitizenIdAsync(It.IsAny<RepAgg.CitizenId>()))
                .ReturnsAsync(false);

            _repoMock
                .Setup(r => r.ExistsByEmailAsync(It.IsAny<RepAgg.RepresentativeEmail>()))
                .ReturnsAsync(false);

            // Mock GetAllAsync to return empty list for email uniqueness check
            _orgRepoMock
                .Setup(r => r.GetAllAsync(It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new List<OrgAgg.ShippingAgentOrganization>());

            _orgRepoMock
                .Setup(r => r.GetByLegalNameAsync(It.IsAny<OrgAgg.LegalName>()))
                .ReturnsAsync(mockOrg);

            RepAgg.ShippingAgentRepresentative? captured = null;
            _repoMock
                .Setup(r => r.AddAsync(It.IsAny<RepAgg.ShippingAgentRepresentative>()))
                .Callback<RepAgg.ShippingAgentRepresentative>(rep => captured = rep)
                .Returns(Task.CompletedTask);

            _mockContext
                .Setup(c => c.SaveChangesAsync(It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(1);

            // Act
            var created = await _service.CreateRepresentativeAsync(dto);

            // Assert
            Assert.IsNotNull(captured, "Repository.AddAsync should have been called with a representative.");
            Assert.AreEqual(dto.CitizenId, captured!.CitizenId.Value);
            Assert.AreEqual(dto.RepresentativeName, captured.RepresentativeName.Value);
            Assert.AreEqual(dto.RepresentativeEmail, captured.RepresentativeEmail.Value);
            Assert.AreEqual(dto.RepresentativeNationality, captured.RepresentativeNationality.Value);
            Assert.AreEqual("912345678", captured.RepresentativePhone.Value);
            Assert.IsNotNull(captured.OrganizationId);
            Assert.AreEqual(mockOrg.Id.Value, captured.OrganizationId!.Value);

            _repoMock.Verify(r => r.AddAsync(It.IsAny<RepAgg.ShippingAgentRepresentative>()), Times.Once);
            _orgRepoMock.Verify(r => r.GetByLegalNameAsync(It.IsAny<OrgAgg.LegalName>()), Times.Once);
            _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<System.Threading.CancellationToken>()), Times.Once);
        }

        [TestMethod]
        public async Task CreateRepresentativeAsync_WithoutOrganizationName_ShouldThrowArgumentException()
        {
            // Arrange
            var dto = ValidCreateDto(null); // OrganizationName null

            // Mock uniqueness checks that run before the OrganizationName check
            _repoMock
                .Setup(r => r.ExistsByCitizenIdAsync(It.IsAny<RepAgg.CitizenId>()))
                .ReturnsAsync(false);

            _repoMock
                .Setup(r => r.ExistsByEmailAsync(It.IsAny<RepAgg.RepresentativeEmail>()))
                .ReturnsAsync(false);

            _orgRepoMock
                .Setup(r => r.GetAllAsync(It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(new List<OrgAgg.ShippingAgentOrganization>());

            // Act & Assert
            await Assert.ThrowsExceptionAsync<ArgumentException>(() => _service.CreateRepresentativeAsync(dto));

            _repoMock.Verify(r => r.AddAsync(It.IsAny<RepAgg.ShippingAgentRepresentative>()), Times.Never);
        }

        // GetByCitizenIdAsync
        [TestMethod]
        public async Task GetByCitizenIdAsync_WhenFound_ShouldReturnMappedDto()
        {
            // Arrange
            var rep = BuildDomainRep(withOrg: true);
            var citizenId = rep.CitizenId.Value;

            _repoMock
                .Setup(r => r.GetByCitizenIdAsync(It.IsAny<RepAgg.CitizenId>()))
                .ReturnsAsync(rep);

            // Act
            var dto = await _service.GetByCitizenIdAsync(citizenId);

            // Assert
            Assert.IsNotNull(dto);
            Assert.AreEqual(rep.RepresentativeId.Value.ToString(), dto!.RepresentativeId);
            Assert.AreEqual(rep.OrganizationId!.Value.ToString(), dto.OrganizationId);
            Assert.AreEqual(rep.RepresentativeName.Value, dto.RepresentativeName);
            Assert.AreEqual(rep.CitizenId.Value, dto.CitizenId);
            Assert.AreEqual(rep.RepresentativeNationality.Value, dto.RepresentativeNationality);
            Assert.AreEqual(rep.RepresentativeEmail.Value, dto.RepresentativeEmail);
            Assert.AreEqual(rep.RepresentativePhone.Value, dto.RepresentativePhone);

            _repoMock.Verify(r => r.GetByCitizenIdAsync(It.IsAny<RepAgg.CitizenId>()), Times.Once);
        }

        [TestMethod]
        public async Task GetByCitizenIdAsync_WhenNotFound_ShouldReturnNull()
        {
            var citizenId = "NONEXISTENT";
            _repoMock
                .Setup(r => r.GetByCitizenIdAsync(It.IsAny<RepAgg.CitizenId>()))
                .ReturnsAsync((RepAgg.ShippingAgentRepresentative?)null);

            var dto = await _service.GetByCitizenIdAsync(citizenId);

            Assert.IsNull(dto);
            _repoMock.Verify(r => r.GetByCitizenIdAsync(It.IsAny<RepAgg.CitizenId>()), Times.Once);
        }

        // GetAllSimplifiedAsync
        [TestMethod]
        public async Task GetAllSimplifiedAsync_ShouldReturnMappedList()
        {
            var orgId = OrgAgg.OrganizationId.NewId();
            var mockOrg = new OrgAgg.ShippingAgentOrganization(
                orgId,
                new OrgAgg.LegalName("Test Organization"),
                new OrgAgg.AlternativeName("ALt name"),
                new OrgAgg.Address("Street", "City", "Country"),
                new OrgAgg.TaxNumber("123456789"),
                "test@org.com",
                "912345678"
            );

            var reps = new List<RepAgg.ShippingAgentRepresentative>
            {
                BuildDomainRep(withOrg: true),
                BuildDomainRep(withOrg: false)
            };
            
            // Attach organization to first rep
            reps[0].AttachToOrganization(orgId);

            _repoMock
                .Setup(r => r.GetAllAsync())
                .ReturnsAsync(reps);

            // Mock organization repository GetByIdAsync for the first rep
            _orgRepoMock
                .Setup(r => r.GetByIdAsync(It.IsAny<OrgAgg.OrganizationId>()))
                .ReturnsAsync(mockOrg);

            var dtos = (await _service.GetAllSimplifiedAsync()).ToList();

            Assert.AreEqual(reps.Count, dtos.Count);
            Assert.AreEqual(reps[0].RepresentativeName.Value, dtos[0].Name);
            Assert.AreEqual(reps[0].CitizenId.Value, dtos[0].CitizenId);
            Assert.AreEqual(reps[1].RepresentativeName.Value, dtos[1].Name);
            Assert.AreEqual(reps[1].CitizenId.Value, dtos[1].CitizenId);

            _repoMock.Verify(r => r.GetAllAsync(), Times.Once);
        }

        [TestMethod]
        public async Task UpdateRepresentativeByCitizenIdAsync_WhenNotFound_ShouldReturnNull()
        {
            var citizenId = "NONEXISTENT";
            var dto = ValidCreateDto();

            _repoMock
                .Setup(r => r.GetByCitizenIdAsync(It.IsAny<RepAgg.CitizenId>()))
                .ReturnsAsync((RepAgg.ShippingAgentRepresentative?)null);

            var result = await _service.UpdateRepresentativeByCitizenIdAsync(citizenId, dto);

            Assert.IsNull(result);
            _repoMock.Verify(r => r.GetByCitizenIdAsync(It.IsAny<RepAgg.CitizenId>()), Times.Once);
            _repoMock.Verify(r => r.UpdateAsync(It.IsAny<RepAgg.ShippingAgentRepresentative>()), Times.Never);
        }

        // DeleteRepresentativeByCitizenIdAsync
        [TestMethod]
        public async Task DeleteRepresentativeByCitizenIdAsync_WhenFound_ShouldDeleteAndReturnTrue()
        {
            var existing = BuildDomainRep(withOrg: true);
            var citizenId = existing.CitizenId.Value;

            _repoMock
                .Setup(r => r.GetByCitizenIdAsync(It.IsAny<RepAgg.CitizenId>()))
                .ReturnsAsync(existing);

            _repoMock
                .Setup(r => r.DeleteAsync(existing))
                .Returns(Task.CompletedTask);

            var ok = await _service.DeleteRepresentativeByCitizenIdAsync(citizenId);

            Assert.IsTrue(ok);
            _repoMock.Verify(r => r.GetByCitizenIdAsync(It.IsAny<RepAgg.CitizenId>()), Times.Once);
            _repoMock.Verify(r => r.DeleteAsync(existing), Times.Once);
        }

        [TestMethod]
        public async Task DeleteRepresentativeByCitizenIdAsync_WhenNotFound_ShouldReturnFalse()
        {
            var citizenId = "NONEXISTENT";

            _repoMock
                .Setup(r => r.GetByCitizenIdAsync(It.IsAny<RepAgg.CitizenId>()))
                .ReturnsAsync((RepAgg.ShippingAgentRepresentative?)null);

            var ok = await _service.DeleteRepresentativeByCitizenIdAsync(citizenId);

            Assert.IsFalse(ok);
            _repoMock.Verify(r => r.GetByCitizenIdAsync(It.IsAny<RepAgg.CitizenId>()), Times.Once);
            _repoMock.Verify(r => r.DeleteAsync(It.IsAny<RepAgg.ShippingAgentRepresentative>()), Times.Never);
        }


        [TestMethod]
        public async Task GetSimplifiedByOrganizationIdAsync_WithInvalidGuid_ShouldThrowFormatException()
        {
            await Assert.ThrowsExceptionAsync<FormatException>(async () =>
                await _service.GetSimplifiedByOrganizationIdAsync("invalid-guid"));
        }
    }
}