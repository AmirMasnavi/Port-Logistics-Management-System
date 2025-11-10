using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Application.ShippingAgentsOrganization.Services;
using PortProject.Api.Application.ShippingAgentsRepresentative.Services;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Models;
using Xunit;

namespace PortProject.Api.Tests.Application.ShippingAgentOrganization;

public class ShippingAgentOrganizationServiceTest
{
    private readonly Mock<IShippingAgentOrganizationRepository> _orgRepoMock;
    private readonly Mock<IShippingAgentRepresentativeService> _repServiceMock;

    public ShippingAgentOrganizationServiceTest()
    {
        _orgRepoMock = new Mock<IShippingAgentOrganizationRepository>();
        _repServiceMock = new Mock<IShippingAgentRepresentativeService>();
    }

    private static PortProjectContext NewInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<PortProjectContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new PortProjectContext(options);
    }

    [Fact]
    public async Task RegisterOrganizationAsync_DuplicateTax_Throws()
    {
        // Arrange
        using var ctx = NewInMemoryContext();
        var service = new ShippingAgentOrganizationService(_orgRepoMock.Object, ctx, _repServiceMock.Object);

        var dto = new CreateShippingAgentOrganizationDto
        {
            LegalName = "ACME Corp",
            AlternativeName = "ACME",
            Street = "Rua 1",
            City = "Porto",
            Country = "Portugal",
            TaxNumber = "PT123456789",
            Representatives = new List<CreateShippingAgentRepresentativeForOrganizationDto>
            {
                new()
                {
                    RepresentativeName = "John Doe",
                    CitizenId = "CIT-1",
                    RepresentativeNationality = "PT",
                    RepresentativeEmail = "john@acme.com",
                    RepresentativePhone = "+351912345678"
                }
            }
        };

        _orgRepoMock.Setup(r => r.ExistsByLegalNameAsync(It.IsAny<LegalName>()))
            .ReturnsAsync(false);
        _orgRepoMock.Setup(r => r.ExistsByTaxNumberAsync(It.IsAny<TaxNumber>()))
            .ReturnsAsync(true);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RegisterOrganizationAsync(dto));
        _orgRepoMock.Verify(r => r.AddAsync(It.IsAny<PortProject.Api.Domain.ShippingAgentOrganizationAggregate.ShippingAgentOrganization>()), Times.Never);
    }

    [Fact]
    public async Task RegisterOrganizationAsync_DuplicateLegalName_Throws()
    {
        // Arrange
        using var ctx = NewInMemoryContext();
        var service = new ShippingAgentOrganizationService(_orgRepoMock.Object, ctx, _repServiceMock.Object);

        var dto = new CreateShippingAgentOrganizationDto
        {
            LegalName = "ACME Corp",
            AlternativeName = "ACME",
            Street = "Rua 1",
            City = "Porto",
            Country = "Portugal",
            TaxNumber = "PT123456789",
            Representatives = new List<CreateShippingAgentRepresentativeForOrganizationDto>
            {
                new()
                {
                    RepresentativeName = "John Doe",
                    CitizenId = "CIT-1",
                    RepresentativeNationality = "PT",
                    RepresentativeEmail = "john@acme.com",
                    RepresentativePhone = "+351912345678"
                }
            }
        };

        _orgRepoMock.Setup(r => r.ExistsByLegalNameAsync(It.IsAny<LegalName>()))
            .ReturnsAsync(true);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RegisterOrganizationAsync(dto));
        _orgRepoMock.Verify(r => r.AddAsync(It.IsAny<PortProject.Api.Domain.ShippingAgentOrganizationAggregate.ShippingAgentOrganization>()), Times.Never);
    }

    [Fact]
    public async Task RegisterOrganizationAsync_NoRepresentatives_Throws()
    {
        // Arrange
        using var ctx = NewInMemoryContext();
        var service = new ShippingAgentOrganizationService(_orgRepoMock.Object, ctx, _repServiceMock.Object);

        var dto = new CreateShippingAgentOrganizationDto
        {
            LegalName = "ACME Corp",
            AlternativeName = "ACME",
            Street = "Rua 1",
            City = "Porto",
            Country = "Portugal",
            TaxNumber = "PT123456789",
            Representatives = new List<CreateShippingAgentRepresentativeForOrganizationDto>()
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RegisterOrganizationAsync(dto));
        _orgRepoMock.Verify(r => r.AddAsync(It.IsAny<PortProject.Api.Domain.ShippingAgentOrganizationAggregate.ShippingAgentOrganization>()), Times.Never);
    }

    [Fact]
    public async Task GetByIdAsync_Found_ReturnsDto()
    {
        // Arrange
        using var ctx = NewInMemoryContext();
        var service = new ShippingAgentOrganizationService(_orgRepoMock.Object, ctx, _repServiceMock.Object);

        var id = Guid.NewGuid();
        var org = new PortProject.Api.Domain.ShippingAgentOrganizationAggregate.ShippingAgentOrganization(
            new OrganizationId(id),
            new LegalName("ACME Corp"),
            new AlternativeName("ACME"),
            new Address("Rua 1", "Porto", "Portugal"),
            new TaxNumber("PT123456789")
        );

        _orgRepoMock.Setup(r => r.GetByIdAsync(It.Is<OrganizationId>(o => o.Value == id)))
            .ReturnsAsync(org);

        // Act
        var dto = await service.GetByIdAsync(id);

        // Assert
        Assert.NotNull(dto);
        Assert.Equal(id.ToString(), dto?.Id);
        Assert.Equal("ACME Corp", dto?.LegalName);
        Assert.Equal("ACME", dto?.AlternativeName);
        Assert.Equal("Rua 1", dto?.Street);
        Assert.Equal("Porto", dto?.City);
        Assert.Equal("Portugal", dto?.Country);
        Assert.Equal("PT123456789", dto?.TaxNumber);
    }

    [Fact]
    public async Task GetByIdAsync_NotFound_ReturnsNull()
    {
        // Arrange
        using var ctx = NewInMemoryContext();
        var service = new ShippingAgentOrganizationService(_orgRepoMock.Object, ctx, _repServiceMock.Object);

        var id = Guid.NewGuid();
        _orgRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<OrganizationId>()))
            .ReturnsAsync((PortProject.Api.Domain.ShippingAgentOrganizationAggregate.ShippingAgentOrganization)null);

        // Act
        var dto = await service.GetByIdAsync(id);

        // Assert
        Assert.Null(dto);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsMappedList()
    {
        // Arrange
        using var ctx = NewInMemoryContext();
        var service = new ShippingAgentOrganizationService(_orgRepoMock.Object, ctx, _repServiceMock.Object);

        var orgs = new List<PortProject.Api.Domain.ShippingAgentOrganizationAggregate.ShippingAgentOrganization>
        {
            new(
                OrganizationId.NewId(),
                new LegalName("ACME Corp"),
                new AlternativeName("ACME"),
                new Address("Rua 1", "Porto", "Portugal"),
                new TaxNumber("PT123456789")
            ),
            new(
                OrganizationId.NewId(),
                new LegalName("Globex"),
                new AlternativeName("GBX"),
                new Address("Av. 2", "Lisboa", "Portugal"),
                new TaxNumber("PT999888777")
            )
        };

        _orgRepoMock.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((IEnumerable<PortProject.Api.Domain.ShippingAgentOrganizationAggregate.ShippingAgentOrganization>)orgs);

        // Act
        var result = await service.GetAllAsync();

        // Assert
        var list = result.ToList();
        Assert.Equal(2, list.Count);
        Assert.Contains(list, x => x.LegalName == "ACME Corp" && x.TaxNumber == "PT123456789");
        Assert.Contains(list, x => x.LegalName == "Globex" && x.TaxNumber == "PT999888777");
    }
    

    [Fact]
    public async Task AddRepresentativeToOrganizationAsync_OrgNotFound_Throws()
    {
        // Arrange
        using var ctx = NewInMemoryContext();
        var service = new ShippingAgentOrganizationService(_orgRepoMock.Object, ctx, _repServiceMock.Object);

        var anyId = Guid.NewGuid().ToString();
        _orgRepoMock.Setup(r => r.GetByIdAsync(It.IsAny<OrganizationId>()))
            .ReturnsAsync((PortProject.Api.Domain.ShippingAgentOrganizationAggregate.ShippingAgentOrganization)null);

        var dto = new CreateShippingAgentRepresentativeDto
        {
            RepresentativeName = "John Doe",
            CitizenId = "CIT-1",
            RepresentativeNationality = "PT",
            RepresentativeEmail = "john@acme.com",
            RepresentativePhone = "+351912345678"
        };

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.AddRepresentativeToOrganizationAsync(anyId, dto));
    }
}
