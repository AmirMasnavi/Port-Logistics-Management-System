using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Application.ShippingAgentsRepresentative.Services;
using OrgAgg = PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using RepAgg = PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;

namespace PortProject.Api.Tests.Application.ShippingAgentRepresentative
{
    [TestClass]
    public class ShippingAgentRepresentativeServiceTest
    {
        private Mock<RepAgg.IShippingAgentRepresentativeRepository> _repoMock = null!;
        private ShippingAgentRepresentativeService _service = null!;

        [TestInitialize]
        public void Setup()
        {
            _repoMock = new Mock<RepAgg.IShippingAgentRepresentativeRepository>(MockBehavior.Strict);
            _service = new ShippingAgentRepresentativeService(_repoMock.Object);
        }

        private static CreateShippingAgentRepresentativeDto ValidCreateDto(string? orgId = null)
        {
            return new CreateShippingAgentRepresentativeDto
            {
                OrganizationId = orgId ?? string.Empty,
                CitizenId = "12345678Z",
                RepresentativeName = "Ana Silva",
                RepresentativeEmail = "ana.silva@example.com",
                // Domain requires 9 digits starting with 9
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
        public async Task CreateRepresentativeAsync_WithOrganizationId_ShouldAttachAndCallAdd()
        {
            // Arrange
            var orgId = OrgAgg.OrganizationId.NewId().Value.ToString();
            var dto = ValidCreateDto(orgId);

            RepAgg.ShippingAgentRepresentative? captured = null;
            _repoMock
                .Setup(r => r.AddAsync(It.IsAny<RepAgg.ShippingAgentRepresentative>()))
                .Callback<RepAgg.ShippingAgentRepresentative>(rep => captured = rep)
                .Returns(Task.CompletedTask);

            // Act
            var created = await _service.CreateRepresentativeAsync(dto);

            // Assert
            Assert.IsNotNull(captured, "Repository.AddAsync should have been called with a representative.");
            Assert.AreEqual(dto.CitizenId, captured!.CitizenId.Value);
            Assert.AreEqual(dto.RepresentativeName, captured.RepresentativeName.Value);
            Assert.AreEqual(dto.RepresentativeEmail, captured.RepresentativeEmail.Value);
            Assert.AreEqual(dto.RepresentativeNationality, captured.RepresentativeNationality.Value);
            Assert.AreEqual("912345678", captured.RepresentativePhone.Value);
            // Organization should be attached because dto.OrganizationId is provided
            Assert.IsNotNull(captured.OrganizationId);
            Assert.IsNotNull(created.OrganizationId);

            _repoMock.Verify(r => r.AddAsync(It.IsAny<RepAgg.ShippingAgentRepresentative>()), Times.Once);
        }

        [TestMethod]
        public async Task CreateRepresentativeAsync_WithoutOrganizationId_ShouldNotAttachOrganization()
        {
            // Arrange
            var dto = ValidCreateDto(); // OrganizationId empty
            RepAgg.ShippingAgentRepresentative? captured = null;

            _repoMock
                .Setup(r => r.AddAsync(It.IsAny<RepAgg.ShippingAgentRepresentative>()))
                .Callback<RepAgg.ShippingAgentRepresentative>(rep => captured = rep)
                .Returns(Task.CompletedTask);

            // Act
            var created = await _service.CreateRepresentativeAsync(dto);

            // Assert
            Assert.IsNotNull(captured);
            Assert.IsNull(captured!.OrganizationId, "OrganizationId should remain null when not provided.");
            Assert.IsNull(created.OrganizationId, "Returned entity should also have null OrganizationId.");

            _repoMock.Verify(r => r.AddAsync(It.IsAny<RepAgg.ShippingAgentRepresentative>()), Times.Once);
        }

        // GetByIdAsync
        [TestMethod]
        public async Task GetByIdAsync_WhenFound_ShouldReturnMappedDto()
        {
            // Arrange
            var rep = BuildDomainRep(withOrg: true);
            var id = rep.RepresentativeId.Value.ToString();

            _repoMock
                .Setup(r => r.GetByIdAsync(It.IsAny<RepAgg.RepresentativeId>()))
                .ReturnsAsync(rep);

            // Act
            var dto = await _service.GetByIdAsync(id);

            // Assert
            Assert.IsNotNull(dto);
            Assert.AreEqual(id, dto!.RepresentativeId);
            Assert.AreEqual(rep.OrganizationId!.Value.ToString(), dto.OrganizationId);
            Assert.AreEqual(rep.RepresentativeName.Value, dto.RepresentativeName);
            Assert.AreEqual(rep.CitizenId.Value, dto.CitizenId);
            Assert.AreEqual(rep.RepresentativeNationality.Value, dto.RepresentativeNationality);
            Assert.AreEqual(rep.RepresentativeEmail.Value, dto.RepresentativeEmail);
            Assert.AreEqual(rep.RepresentativePhone.Value, dto.RepresentativePhone);

            _repoMock.Verify(r => r.GetByIdAsync(It.IsAny<RepAgg.RepresentativeId>()), Times.Once);
        }

        [TestMethod]
        public async Task GetByIdAsync_WhenNotFound_ShouldReturnNull()
        {
            var anyId = Guid.NewGuid().ToString();
            _repoMock
                .Setup(r => r.GetByIdAsync(It.IsAny<RepAgg.RepresentativeId>()))
                .ReturnsAsync((RepAgg.ShippingAgentRepresentative?)null);

            var dto = await _service.GetByIdAsync(anyId);

            Assert.IsNull(dto);
            _repoMock.Verify(r => r.GetByIdAsync(It.IsAny<RepAgg.RepresentativeId>()), Times.Once);
        }

        // GetAllAsync
        [TestMethod]
        public async Task GetAllAsync_ShouldReturnMappedList()
        {
            var reps = new List<RepAgg.ShippingAgentRepresentative>
            {
                BuildDomainRep(withOrg: true),
                BuildDomainRep(withOrg: false)
            };

            _repoMock
                .Setup(r => r.GetAllAsync())
                .ReturnsAsync(reps);

            var dtos = (await _service.GetAllAsync()).ToList();

            Assert.AreEqual(reps.Count, dtos.Count);
            for (int i = 0; i < reps.Count; i++)
            {
                Assert.AreEqual(reps[i].RepresentativeId.Value.ToString(), dtos[i].RepresentativeId);
                var expectedOrg = reps[i].OrganizationId?.Value.ToString() ?? string.Empty;
                Assert.AreEqual(expectedOrg, dtos[i].OrganizationId);
            }

            _repoMock.Verify(r => r.GetAllAsync(), Times.Once);
        }

        // UpdateRepresentativeAsync
        [TestMethod]
        public async Task UpdateRepresentativeAsync_WhenFound_ShouldUpdateAndReturnDto()
        {
            // Arrange existing rep
            var existing = BuildDomainRep(withOrg: true);
            var id = existing.RepresentativeId.Value.ToString();

            _repoMock
                .Setup(r => r.GetByIdAsync(It.IsAny<RepAgg.RepresentativeId>()))
                .ReturnsAsync(existing);

            _repoMock
                .Setup(r => r.UpdateAsync(existing))
                .Returns(Task.CompletedTask);

            var updateDto = new CreateShippingAgentRepresentativeDto
            {
                CitizenId = "87654321K",
                RepresentativeName = "Beatriz Costa",
                RepresentativePhone = "934567890",
                RepresentativeNationality = "ES",
                RepresentativeEmail = "beatriz.costa@example.org"
            };

            // Act
            var result = await _service.UpdateRepresentativeAsync(id, updateDto);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(id, result!.RepresentativeId);
            Assert.AreEqual(updateDto.CitizenId, existing.CitizenId.Value);
            Assert.AreEqual(updateDto.RepresentativeName, existing.RepresentativeName.Value);
            Assert.AreEqual(updateDto.RepresentativePhone, existing.RepresentativePhone.Value);
            Assert.AreEqual(updateDto.RepresentativeNationality, existing.RepresentativeNationality.Value);
            Assert.AreEqual(updateDto.RepresentativeEmail, existing.RepresentativeEmail.Value);

            _repoMock.Verify(r => r.GetByIdAsync(It.IsAny<RepAgg.RepresentativeId>()), Times.Once);
            _repoMock.Verify(r => r.UpdateAsync(existing), Times.Once);
        }

        [TestMethod]
        public async Task UpdateRepresentativeAsync_WhenNotFound_ShouldReturnNull()
        {
            var id = Guid.NewGuid().ToString();
            var dto = ValidCreateDto();

            _repoMock
                .Setup(r => r.GetByIdAsync(It.IsAny<RepAgg.RepresentativeId>()))
                .ReturnsAsync((RepAgg.ShippingAgentRepresentative?)null);

            var result = await _service.UpdateRepresentativeAsync(id, dto);

            Assert.IsNull(result);
            _repoMock.Verify(r => r.GetByIdAsync(It.IsAny<RepAgg.RepresentativeId>()), Times.Once);
            _repoMock.Verify(r => r.UpdateAsync(It.IsAny<RepAgg.ShippingAgentRepresentative>()), Times.Never);
        }

        // DeleteRepresentativeAsync
        [TestMethod]
        public async Task DeleteRepresentativeAsync_WhenFound_ShouldDeleteAndReturnTrue()
        {
            var existing = BuildDomainRep(withOrg: true);
            var id = existing.RepresentativeId.Value.ToString();

            _repoMock
                .Setup(r => r.GetByIdAsync(It.IsAny<RepAgg.RepresentativeId>()))
                .ReturnsAsync(existing);

            _repoMock
                .Setup(r => r.DeleteAsync(existing))
                .Returns(Task.CompletedTask);

            var ok = await _service.DeleteRepresentativeAsync(id);

            Assert.IsTrue(ok);
            _repoMock.Verify(r => r.GetByIdAsync(It.IsAny<RepAgg.RepresentativeId>()), Times.Once);
            _repoMock.Verify(r => r.DeleteAsync(existing), Times.Once);
        }

        [TestMethod]
        public async Task DeleteRepresentativeAsync_WhenNotFound_ShouldReturnFalse()
        {
            var id = Guid.NewGuid().ToString();

            _repoMock
                .Setup(r => r.GetByIdAsync(It.IsAny<RepAgg.RepresentativeId>()))
                .ReturnsAsync((RepAgg.ShippingAgentRepresentative?)null);

            var ok = await _service.DeleteRepresentativeAsync(id);

            Assert.IsFalse(ok);
            _repoMock.Verify(r => r.GetByIdAsync(It.IsAny<RepAgg.RepresentativeId>()), Times.Once);
            _repoMock.Verify(r => r.DeleteAsync(It.IsAny<RepAgg.ShippingAgentRepresentative>()), Times.Never);
        }

        // GetByOrganizationIdAsync
        [TestMethod]
        public async Task GetByOrganizationIdAsync_ShouldParseGuidAndReturnMappedList()
        {
            var orgId = OrgAgg.OrganizationId.NewId();
            var reps = new List<RepAgg.ShippingAgentRepresentative>
            {
                BuildDomainRep(withOrg: true),
                BuildDomainRep(withOrg: true)
            };
            // Ensure all reps are attached to the same orgId to make assertion clearer
            foreach (var rep in reps)
            {
                // Attach overriding to a deterministic id
                rep.AttachToOrganization(orgId);
            }

            _repoMock
                .Setup(r => r.GetByOrganizationIdAsync(It.IsAny<OrgAgg.OrganizationId>()))
                .ReturnsAsync(reps);

            var dtos = (await _service.GetByOrganizationIdAsync(orgId.Value.ToString())).ToList();

            Assert.AreEqual(reps.Count, dtos.Count);
            Assert.IsTrue(dtos.All(d => d.OrganizationId == orgId.Value.ToString()));

            _repoMock.Verify(r => r.GetByOrganizationIdAsync(It.IsAny<OrgAgg.OrganizationId>()), Times.Once);
        }

        [TestMethod]
        public async Task Methods_WithInvalidGuid_ShouldThrowFormatException()
        {
            // invalid GUIDs should throw because service uses Guid.Parse
            var invalid = "not-a-guid";

            await Assert.ThrowsExceptionAsync<FormatException>(async () =>
                await _service.GetByIdAsync(invalid));
        }

        [TestMethod]
        public async Task GetByOrganizationIdAsync_WithInvalidGuid_ShouldThrowFormatException()
        {
            await Assert.ThrowsExceptionAsync<FormatException>(async () =>
                await _service.GetByOrganizationIdAsync("invalid-guid"));
        }
    }
}