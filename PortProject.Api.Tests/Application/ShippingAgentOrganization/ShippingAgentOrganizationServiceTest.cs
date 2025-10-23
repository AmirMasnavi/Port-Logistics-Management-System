using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore; // para DbSet
using Microsoft.EntityFrameworkCore.ChangeTracking; // EntityEntry
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Application.ShippingAgentsOrganization.Services;
using PortProject.Api.Application.ShippingAgentsRepresentative.Services;
using PortProject.Api.Models;
// Aliases to avoid conflicts with test namespaces
using OrgAgg = PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using RepAgg = PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;

namespace PortProject.Api.Tests.Application.ShippingAgentOrganization
{
    [TestClass]
    public class ShippingAgentOrganizationServiceTests
    {
        private Mock<OrgAgg.IShippingAgentOrganizationRepository> _repoMock = null!;
        private Mock<IShippingAgentRepresentativeService> _repServiceMock = null!;
        private Mock<PortProjectContext> _ctxMock = null!;
        private Mock<DbSet<RepAgg.ShippingAgentRepresentative>> _repDbSetMock = null!;
        private ShippingAgentOrganizationService _sut = null!;

        [TestInitialize]
        public void Setup()
        {
            _repoMock = new Mock<OrgAgg.IShippingAgentOrganizationRepository>(MockBehavior.Strict);
            _repServiceMock = new Mock<IShippingAgentRepresentativeService>(MockBehavior.Strict);

            // Mock DbSet<ShippingAgentRepresentative> apenas com AddAsync usado no serviço
            _repDbSetMock = new Mock<DbSet<RepAgg.ShippingAgentRepresentative>>();
            _repDbSetMock
                .Setup(d => d.AddAsync(It.IsAny<RepAgg.ShippingAgentRepresentative>(), It.IsAny<CancellationToken>()))
                .Returns(ValueTask.FromResult<EntityEntry<RepAgg.ShippingAgentRepresentative>>(null!));

            // Mock do contexto
            _ctxMock = new Mock<PortProjectContext>(MockBehavior.Strict);
            _ctxMock.SetupGet(c => c.ShippingAgentRepresentatives).Returns(_repDbSetMock.Object);
            _ctxMock.Setup(c => c.Update(It.IsAny<object>()));
            _ctxMock
                .Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            _sut = new ShippingAgentOrganizationService(_repoMock.Object, _ctxMock.Object, _repServiceMock.Object);
        }

        // -------------------- AddRepresentativeToOrganizationAsync --------------------

        [TestMethod]
        public async Task AddRepresentativeToOrganizationAsync_WithEmptyOrgId_ShouldThrowArgumentException()
        {
            var dto = MinimalRepCreateDto();

            await Assert.ThrowsExceptionAsync<ArgumentException>(async () =>
                await _sut.AddRepresentativeToOrganizationAsync("", dto));
        }

        [TestMethod]
        public async Task AddRepresentativeToOrganizationAsync_WhenOrgNotFound_ShouldThrowKeyNotFound()
        {
            var orgId = Guid.NewGuid().ToString();
            _repoMock
                .Setup(r => r.GetByIdAsync(It.Is<OrgAgg.OrganizationId>(o => o.Value == Guid.Parse(orgId))))
                .ReturnsAsync((OrgAgg.ShippingAgentOrganization?)null);

            await Assert.ThrowsExceptionAsync<KeyNotFoundException>(async () =>
                await _sut.AddRepresentativeToOrganizationAsync(orgId, MinimalRepCreateDto()));

            _repoMock.Verify(r => r.GetByIdAsync(It.IsAny<OrgAgg.OrganizationId>()), Times.Once);
        }

        [TestMethod]
        public async Task AddRepresentativeToOrganizationAsync_WhenOk_ShouldReturnMappedDto_AndPersist()
        {
            // Arrange
            var orgGuid = Guid.NewGuid();
            var org = new OrgAgg.ShippingAgentOrganization(
                new OrgAgg.OrganizationId(orgGuid),
                new OrgAgg.LegalName("Org Lda"),
                new OrgAgg.AlternativeName("Org Alt"),
                new OrgAgg.Address("Rua", "Cidade", "PT"),
                new OrgAgg.TaxNumber("123456789"));

            var orgIdStr = orgGuid.ToString();

            _repoMock
                .Setup(r => r.GetByIdAsync(It.Is<OrgAgg.OrganizationId>(o => o.Value == orgGuid)))
                .ReturnsAsync(org);

            var rep = new RepAgg.ShippingAgentRepresentative(
                new RepAgg.CitizenId("12345678Z"),
                new RepAgg.RepresentativeName("Ana"),
                new RepAgg.RepresentativePhone("912345678"),
                new RepAgg.RepresentativeNationality("PT"),
                new RepAgg.RepresentativeEmail("ana@ex.com")
            );
            // normalmente AttachToOrganization seria feito; aqui o serviço não chama,
            // por isso simulamos que o _repService já devolve com org associada (se o teu método não fizer isto, ajusta o teste)
            rep.AttachToOrganization(org.Id!);

            _repServiceMock
                .Setup(s => s.CreateRepresentativeAsync(It.IsAny<CreateShippingAgentRepresentativeDto>()))
                .ReturnsAsync(rep);

            // Act
            var dto = await _sut.AddRepresentativeToOrganizationAsync(orgIdStr, MinimalRepCreateDto());

            // Assert mapping
            Assert.AreEqual(rep.RepresentativeId.Value.ToString(), dto.RepresentativeId);
            Assert.AreEqual(orgGuid.ToString(), dto.OrganizationId);
            Assert.AreEqual("Ana", dto.RepresentativeName);
            Assert.AreEqual("12345678Z", dto.CitizenId);
            Assert.AreEqual("PT", dto.RepresentativeNationality);
            Assert.AreEqual("ana@ex.com", dto.RepresentativeEmail);
            Assert.AreEqual("912345678", dto.RepresentativePhone);

            // Assert side-effects
            _ctxMock.Verify(c => c.Update(org), Times.Once);
            _ctxMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
            _repoMock.Verify(r => r.GetByIdAsync(It.IsAny<OrgAgg.OrganizationId>()), Times.Once);
            _repServiceMock.Verify(s => s.CreateRepresentativeAsync(It.IsAny<CreateShippingAgentRepresentativeDto>()), Times.Once);
        }

        // -------------------- RegisterOrganizationAsync --------------------

        [TestMethod]
        public async Task RegisterOrganizationAsync_WhenNoRepresentatives_ShouldThrowInvalidOperation()
        {
            var dto = new CreateShippingAgentOrganizationDto
            {
                LegalName = "Org",
                AlternativeName = "Alt",
                TaxNumber = "123456789",
                City = "Porto",
                Country = "PT",
                Street = "Rua x",
                Representatives = new List<CreateShippingAgentRepresentativeDto>() // vazio
            };

            await Assert.ThrowsExceptionAsync<InvalidOperationException>(async () =>
                await _sut.RegisterOrganizationAsync(dto));
        }

        [TestMethod]
        public async Task RegisterOrganizationAsync_WhenTaxExists_ShouldThrowInvalidOperation()
        {
            var dto = OrgCreateDtoWithOneRep();

            _repoMock
                .Setup(r => r.ExistsByTaxNumberAsync(It.IsAny<OrgAgg.TaxNumber>()))
                .ReturnsAsync(true);

            await Assert.ThrowsExceptionAsync<InvalidOperationException>(async () =>
                await _sut.RegisterOrganizationAsync(dto));

            _repoMock.Verify(r => r.ExistsByTaxNumberAsync(It.IsAny<OrgAgg.TaxNumber>()), Times.Once);
        }

        [TestMethod]
        public async Task RegisterOrganizationAsync_WhenOk_ShouldCreateOrg_AddReps_Attach_AndPersist()
        {
            // Arrange
            var dto = OrgCreateDtoWithOneRep();

            _repoMock
                .Setup(r => r.ExistsByTaxNumberAsync(It.IsAny<OrgAgg.TaxNumber>()))
                .ReturnsAsync(false);

            OrgAgg.ShippingAgentOrganization? addedOrg = null;
            _repoMock
                .Setup(r => r.AddAsync(It.IsAny<OrgAgg.ShippingAgentOrganization>()))
                .Callback<OrgAgg.ShippingAgentOrganization>(o => addedOrg = o)
                .Returns(Task.CompletedTask);

            var createdRep = new RepAgg.ShippingAgentRepresentative(
                new RepAgg.CitizenId("12345678Z"),
                new RepAgg.RepresentativeName("Ana"),
                new RepAgg.RepresentativePhone("912345678"),
                new RepAgg.RepresentativeNationality("PT"),
                new RepAgg.RepresentativeEmail("ana@ex.com")
            );

            _repServiceMock
                .Setup(s => s.CreateRepresentativeAsync(It.IsAny<CreateShippingAgentRepresentativeDto>()))
                .ReturnsAsync(createdRep);

            // DbSet.AddAsync já está preparado no Setup()

            // Act
            var id = await _sut.RegisterOrganizationAsync(dto);

            // Assert básicos
            Assert.AreNotEqual(Guid.Empty, id, "O método deve devolver o GUID da nova organização.");

            // Verificar que o representante foi associado via AttachToOrganization
            Assert.IsNotNull(addedOrg, "A organização deve ter sido criada e adicionada.");
            Assert.IsNotNull(createdRep.OrganizationId, "O representante deve ter recebido OrganizationId via AttachToOrganization.");
            Assert.AreEqual(addedOrg!.Id!.Value, createdRep.OrganizationId!.Value, "OrganizationId do representante deve corresponder ao da org criada.");

            // Interações esperadas
            _repoMock.Verify(r => r.ExistsByTaxNumberAsync(It.IsAny<OrgAgg.TaxNumber>()), Times.Once);
            _repServiceMock.Verify(s => s.CreateRepresentativeAsync(It.IsAny<CreateShippingAgentRepresentativeDto>()), Times.Exactly(dto.Representatives!.Count));
            _repDbSetMock.Verify(d => d.AddAsync(It.IsAny<RepAgg.ShippingAgentRepresentative>(), It.IsAny<CancellationToken>()), Times.Exactly(dto.Representatives!.Count));
            _repoMock.Verify(r => r.AddAsync(It.IsAny<OrgAgg.ShippingAgentOrganization>()), Times.Once);
            _ctxMock.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        // -------------------- GetByIdAsync --------------------

        [TestMethod]
        public async Task GetByIdAsync_WhenFound_ShouldMapDto()
        {
            var id = Guid.NewGuid();
            var org = new OrgAgg.ShippingAgentOrganization(
                new OrgAgg.OrganizationId(id),
                new OrgAgg.LegalName("Org Lda"),
                new OrgAgg.AlternativeName("Alt"),
                new OrgAgg.Address("Rua", "Cidade", "PT"),
                new OrgAgg.TaxNumber("123456789"));

            _repoMock
                .Setup(r => r.GetByIdAsync(It.Is<OrgAgg.OrganizationId>(o => o.Value == id)))
                .ReturnsAsync(org);

            var dto = await _sut.GetByIdAsync(id);

            Assert.IsNotNull(dto);
            Assert.AreEqual(id.ToString(), dto!.Id);
            Assert.AreEqual("Org Lda", dto.LegalName);
            Assert.AreEqual("Alt", dto.AlternativeName);
            Assert.AreEqual("Rua", dto.Street);
            Assert.AreEqual("Cidade", dto.City);
            Assert.AreEqual("PT", dto.Country);
            Assert.AreEqual("123456789", dto.TaxNumber);

            _repoMock.Verify(r => r.GetByIdAsync(It.Is<OrgAgg.OrganizationId>(o => o.Value == id)), Times.Once);
        }

        [TestMethod]
        public async Task GetByIdAsync_WhenNull_ShouldReturnNull()
        {
            var id = Guid.NewGuid();
            _repoMock
                .Setup(r => r.GetByIdAsync(It.Is<OrgAgg.OrganizationId>(o => o.Value == id)))
                .ReturnsAsync((OrgAgg.ShippingAgentOrganization?)null);

            var dto = await _sut.GetByIdAsync(id);

            Assert.IsNull(dto);
        }

        // -------------------- GetAllAsync --------------------

        [TestMethod]
        public async Task GetAllAsync_ShouldMapAllDtos()
        {
            var list = new List<OrgAgg.ShippingAgentOrganization>
            {
                new OrgAgg.ShippingAgentOrganization(OrgAgg.OrganizationId.NewId(), new OrgAgg.LegalName("A"), new OrgAgg.AlternativeName("A2"), new OrgAgg.Address("R1", "C1", "PT"), new OrgAgg.TaxNumber("123456789")),
                new OrgAgg.ShippingAgentOrganization(OrgAgg.OrganizationId.NewId(), new OrgAgg.LegalName("B"), new OrgAgg.AlternativeName("B2"), new OrgAgg.Address("R2", "C2", "ES"), new OrgAgg.TaxNumber("987654321"))
            };

            _repoMock
                .Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(list);

            var dtos = (await _sut.GetAllAsync()).ToList();

            Assert.AreEqual(2, dtos.Count);
            Assert.AreEqual("A", dtos[0].LegalName);
            Assert.AreEqual("B", dtos[1].LegalName);

            _repoMock.Verify(r => r.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        // -------------------- helpers --------------------

        private static CreateShippingAgentRepresentativeDto MinimalRepCreateDto() =>
            new CreateShippingAgentRepresentativeDto
            {
                CitizenId = "12345678Z",
                RepresentativeName = "Ana",
                RepresentativeEmail = "ana@ex.com",
                RepresentativePhone = "912345678",
                RepresentativeNationality = "PT",
                OrganizationId = Guid.NewGuid().ToString()
            };

        private static CreateShippingAgentOrganizationDto OrgCreateDtoWithOneRep() =>
            new CreateShippingAgentOrganizationDto
            {
                LegalName = "Org Lda",
                AlternativeName = "Alt",
                TaxNumber = "123456789",
                Street = "Rua",
                City = "Cidade",
                Country = "PT",
                Representatives = new List<CreateShippingAgentRepresentativeDto>
                {
                    MinimalRepCreateDto()
                }
            };
    }
}
