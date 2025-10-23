using System;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ShippingAgentOrganizationAggregate
{
    public class ShippingAgentOrganizationTests
    {
        private static ShippingAgentOrganization CreateSample()
        {
            var id = new OrganizationId(Guid.NewGuid());
            var legal = new LegalName("ACME Corp");
            var alt = new AlternativeName("ACME");
            var addr = new Address("Rua 1", "Porto", "Portugal");
            var tax = new TaxNumber("PT123456789"); // ajusta ao teu VO de TaxNumber
            return new ShippingAgentOrganization(id, legal, alt, addr, tax);
        }

        // ✅ Construtor — happy path
        [Fact]
        public void Constructor_Valid_ShouldSetAllFields()
        {
            var id   = new OrganizationId(Guid.NewGuid());
            var leg  = new LegalName("ACME Corp");
            var alt  = new AlternativeName("ACME");
            var addr = new Address("Rua 1", "Porto", "Portugal");
            var tax  = new TaxNumber("PT123456789");

            var org = new ShippingAgentOrganization(id, leg, alt, addr, tax);

            Assert.Same(id, org.Id);
            Assert.Same(leg, org.LegalName);
            Assert.Same(alt, org.AlternativeName);
            Assert.Same(addr, org.Address);
            Assert.Same(tax, org.TaxNumber);
        }

        // ❌ Construtor — argumentos nulos devem lançar
        [Fact]
        public void Constructor_NullId_ShouldThrow()
        {
            var leg  = new LegalName("ACME Corp");
            var alt  = new AlternativeName("ACME");
            var addr = new Address("Rua 1", "Porto", "Portugal");
            var tax  = new TaxNumber("PT123456789");

            var ex = Assert.Throws<ArgumentNullException>(() => new ShippingAgentOrganization(null!, leg, alt, addr, tax));
            Assert.Equal("id", ex.ParamName);
        }

        [Fact]
        public void Constructor_NullLegalName_ShouldThrow()
        {
            var id   = new OrganizationId(Guid.NewGuid());
            var alt  = new AlternativeName("ACME");
            var addr = new Address("Rua 1", "Porto", "Portugal");
            var tax  = new TaxNumber("PT123456789");

            var ex = Assert.Throws<ArgumentNullException>(() => new ShippingAgentOrganization(id, null!, alt, addr, tax));
            Assert.Equal("legalName", ex.ParamName);
        }

        [Fact]
        public void Constructor_NullAlternativeName_ShouldThrow()
        {
            var id   = new OrganizationId(Guid.NewGuid());
            var leg  = new LegalName("ACME Corp");
            var addr = new Address("Rua 1", "Porto", "Portugal");
            var tax  = new TaxNumber("PT123456789");

            var ex = Assert.Throws<ArgumentNullException>(() => new ShippingAgentOrganization(id, leg, null!, addr, tax));
            Assert.Equal("alternativeName", ex.ParamName);
        }

        [Fact]
        public void Constructor_NullAddress_ShouldThrow()
        {
            var id   = new OrganizationId(Guid.NewGuid());
            var leg  = new LegalName("ACME Corp");
            var alt  = new AlternativeName("ACME");
            var tax  = new TaxNumber("PT123456789");

            var ex = Assert.Throws<ArgumentNullException>(() => new ShippingAgentOrganization(id, leg, alt, null!, tax));
            Assert.Equal("address", ex.ParamName);
        }

        [Fact]
        public void Constructor_NullTaxNumber_ShouldThrow()
        {
            var id   = new OrganizationId(Guid.NewGuid());
            var leg  = new LegalName("ACME Corp");
            var alt  = new AlternativeName("ACME");
            var addr = new Address("Rua 1", "Porto", "Portugal");

            var ex = Assert.Throws<ArgumentNullException>(() => new ShippingAgentOrganization(id, leg, alt, addr, null!));
            Assert.Equal("taxNumber", ex.ParamName);
        }

        // ✅ UpdateDetails — atualiza apenas os campos passados != null
        [Fact]
        public void UpdateDetails_WithBothValues_ShouldUpdate()
        {
            var org = CreateSample();

            var newAlt  = new AlternativeName("ACME Group");
            var newAddr = new Address("Av. Nova", "Lisboa", "Portugal");

            org.UpdateDetails(newAlt, newAddr);

            Assert.Same(newAlt, org.AlternativeName);
            Assert.Same(newAddr, org.Address);
        }

        [Fact]
        public void UpdateDetails_WithNullAlternativeName_ShouldKeepOldAlternativeName()
        {
            var org = CreateSample();
            var oldAlt = org.AlternativeName!;
            var newAddr = new Address("Av. Nova", "Lisboa", "Portugal");

            org.UpdateDetails(null!, newAddr);

            Assert.Same(oldAlt, org.AlternativeName);
            Assert.Same(newAddr, org.Address);
        }

        [Fact]
        public void UpdateDetails_WithNullAddress_ShouldKeepOldAddress()
        {
            var org = CreateSample();
            var oldAddr = org.Address!;
            var newAlt = new AlternativeName("ACME Group");

            org.UpdateDetails(newAlt, null!);

            Assert.Same(newAlt, org.AlternativeName);
            Assert.Same(oldAddr, org.Address);
        }

        [Fact]
        public void UpdateDetails_BothNull_ShouldDoNothing()
        {
            var org = CreateSample();
            var oldAlt = org.AlternativeName;
            var oldAddr = org.Address;

            org.UpdateDetails(null!, null!);

            Assert.Same(oldAlt, org.AlternativeName);
            Assert.Same(oldAddr, org.Address);
        }

        // ✅ ToString — usa LegalName e TaxNumber
        [Fact]
        public void ToString_ShouldReturnExpected()
        {
            var org = CreateSample();
            var expected = $"{org.LegalName} ({org.TaxNumber})";
            Assert.Equal(expected, org.ToString());
        }
    }
}
