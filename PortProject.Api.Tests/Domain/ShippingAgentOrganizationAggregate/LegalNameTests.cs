using System;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ShippingAgentOrganizationAggregate
{
    public class LegalNameTests
    {
        // ✅ Construtor — casos válidos
        [Theory]
        [InlineData("ACME")]
        [InlineData("ACME Corp.")]
        [InlineData("ACME & Partners")]
        [InlineData("O'Hara Trading")]
        [InlineData("Company-123 (EU)")]
        [InlineData("ABC")]
        [InlineData("A long but valid company name with numbers 123 and symbols (ok) - yes")]
        public void Constructor_ValidValues_ShouldCreate(string value)
        {
            var legal = new LegalName(value);
            Assert.Equal(value.Trim(), legal.Value);
        }

        [Fact]
        public void Constructor_ShouldTrimInput()
        {
            var legal = new LegalName("   ACME Corp   ");
            Assert.Equal("ACME Corp", legal.Value);
        }

        // ❌ Construtor — nulo, vazio ou espaços
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_EmptyOrNull_ShouldThrow(string input)
        {
            var ex = Assert.Throws<ArgumentException>(() => new LegalName(input));
            Assert.Equal("value", ex.ParamName);
            Assert.Contains("cannot be empty", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        // ❌ Construtor — comprimento inválido
        [Theory]
        [InlineData("AB")] // 2 chars — demasiado curto
        [InlineData("A")]  // 1 char
        public void Constructor_TooShort_ShouldThrow(string input)
        {
            var ex = Assert.Throws<ArgumentException>(() => new LegalName(input));
            Assert.Equal("value", ex.ParamName);
            Assert.Contains("between 3 and 100", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public void Constructor_TooLong_ShouldThrow()
        {
            var tooLong = new string('A', 101);
            var ex = Assert.Throws<ArgumentException>(() => new LegalName(tooLong));
            Assert.Equal("value", ex.ParamName);
            Assert.Contains("between 3 and 100", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public void Constructor_Exactly100Chars_ShouldPass()
        {
            var valid = new string('A', 100);
            var legal = new LegalName(valid);
            Assert.Equal(valid, legal.Value);
        }

        // ❌ Construtor — caracteres inválidos (regex)
        [Theory]
        [InlineData("Acme@Corp")]
        [InlineData("Acme#Corp")]
        [InlineData("Acme/Corp")]
        [InlineData("Acme\\Corp")]
        [InlineData("Acme*Corp")]
        [InlineData("Acme:Corp")]
        [InlineData("Acme;Corp")]
        [InlineData("Acme?Corp")]
        [InlineData("Acme!Corp")]
        [InlineData("Åcme")]   // fora de ASCII
        [InlineData("Acme®")]  // símbolo inválido
        public void Constructor_InvalidCharacters_ShouldThrow(string input)
        {
            var ex = Assert.Throws<ArgumentException>(() => new LegalName(input));
            Assert.Equal("value", ex.ParamName);
            Assert.Contains("invalid characters", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        // ✅ Equals — comportamento esperado
        [Fact]
        public void Equals_SameTextDifferentCase_ShouldBeTrue()
        {
            var a = new LegalName("ACME Corp");
            var b = new LegalName("acme corp");

            Assert.True(a.Equals(b));
            Assert.True(a.Equals((object)b));
        }

        [Fact]
        public void Equals_DifferentValues_ShouldBeFalse()
        {
            var a = new LegalName("ACME Corp");
            var b = new LegalName("ACME Group");

            Assert.False(a.Equals(b));
        }

        [Fact]
        public void Equals_NullOrDifferentType_ShouldBeFalse()
        {
            var a = new LegalName("ACME");
            Assert.False(a.Equals(null));
            Assert.False(a.Equals("ACME")); // tipo diferente
        }

        [Fact]
        public void Equals_SameReference_ShouldBeTrue()
        {
            var a = new LegalName("ACME");
            Assert.True(a.Equals(a));
        }

        // ✅ GetHashCode — coerente com Equals
        [Fact]
        public void GetHashCode_SameIgnoringCase_ShouldMatch()
        {
            var a = new LegalName("ACME Corp");
            var b = new LegalName("acme corp");

            Assert.Equal(a.GetHashCode(), b.GetHashCode());
        }

        [Fact]
        public void GetHashCode_DifferentValues_ShouldDiffer()
        {
            var a = new LegalName("ACME Corp");
            var b = new LegalName("ACME Group");

            Assert.NotEqual(a.GetHashCode(), b.GetHashCode());
        }

        // ✅ ToString
        [Fact]
        public void ToString_ShouldReturnValue()
        {
            var a = new LegalName("ACME & Partners");
            Assert.Equal("ACME & Partners", a.ToString());
        }
    }
}
