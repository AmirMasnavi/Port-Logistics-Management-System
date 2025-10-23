using System;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ShippingAgentOrganizationAggregate
{
    public class TaxNumberTests
    {
        // ✅ Construtor — valores válidos (NIF, VAT, Genérico)
        [Theory]
        [InlineData("123456789")]          // NIF PT (9 dígitos, 1º 1-9)
        [InlineData("PT123456789")]        // VAT UE (2 letras + 9 dígitos)
        [InlineData("de12345678")]         // VAT lowercase → deve subir para uppercase
        [InlineData("FRA1B2C3D4")]         // VAT: 2 letras + 8 alfanum => FR + (A1B2C3D4)
        [InlineData("AB12CD34")]           // Genérico (8)
        [InlineData("ABC123XYZ789PQ1")]    // Genérico (15)
        public void Constructor_Valid_ShouldStoreUppercased(string value)
        {
            // Act
            var tax = new TaxNumber(value);

            // Assert
            Assert.Equal(value.Trim().ToUpperInvariant(), tax.Value);
        }

        // ❌ Construtor — nulos/vazios
        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData(null)]
        public void Constructor_NullOrEmpty_ShouldThrow(string value)
        {
            var ex = Assert.Throws<ArgumentException>(() => new TaxNumber(value));
            Assert.Contains("Tax number is mandatory", ex.Message);
            Assert.Equal("value", ex.ParamName);
        }

        // ❌ Construtor — formatos inválidos (não coincidem com NIF, nem VAT, nem genérico)
        [Theory]
        [InlineData("1234567")]                 // < 8 chars
        [InlineData("PT12345")]                 // < 8 chars
        [InlineData("PT12345678901234")]        // > 15 chars
        [InlineData("PT1234 6789")]             // espaço interno
        [InlineData("PT1234567!")]              // caractere inválido
        [InlineData("A B12CD34")]               // espaço
        [InlineData("AB-12345678")]             // hífen
        public void Constructor_InvalidFormat_ShouldThrow(string value)
        {
            var ex = Assert.Throws<ArgumentException>(() => new TaxNumber(value));
            Assert.Contains("Invalid format for the tax identification number", ex.Message);
            Assert.Equal("value", ex.ParamName);
        }

        // ✅ Equals / HashCode — case-insensitive
        [Fact]
        public void Equals_SameValueDifferentCase_ShouldBeEqual()
        {
            var t1 = new TaxNumber("pt123456789");
            var t2 = new TaxNumber("PT123456789");

            Assert.True(t1.Equals(t2));
            Assert.True(t1 == t2);
            Assert.False(t1 != t2);
            Assert.Equal(t1.GetHashCode(), t2.GetHashCode());
        }

        [Fact]
        public void Equals_DifferentValues_ShouldNotBeEqual()
        {
            var t1 = new TaxNumber("123456789");
            var t2 = new TaxNumber("PT123456789");

            Assert.False(t1.Equals(t2));
            Assert.False(t1 == t2);
            Assert.True(t1 != t2);
            Assert.NotEqual(t1.GetHashCode(), t2.GetHashCode());
        }

        // ✅ ToString
        [Fact]
        public void ToString_ShouldReturnValue()
        {
            var t = new TaxNumber("PT123456789");
            Assert.Equal("PT123456789", t.ToString());
        }
    }
}
