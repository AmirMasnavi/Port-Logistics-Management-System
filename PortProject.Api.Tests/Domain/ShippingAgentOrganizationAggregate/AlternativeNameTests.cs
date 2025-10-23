using System;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ShippingAgentOrganizationAggregate
{
    public class AlternativeNameTests
    {
        // ✅ Construtor — casos válidos
        [Theory]
        [InlineData("Acme")]
        [InlineData("Acme Corp.")]
        [InlineData("Acme, Inc.")]
        [InlineData("Acme & Partners")]
        [InlineData("O'Hara Logistics")]
        [InlineData("ACME-Group (EU)")]
        [InlineData("A1 Solutions")]
        [InlineData("ABC")]                 // limite mínimo (3)
        [InlineData("A very long but valid company name containing words and dashes (ok) - 123")]
        public void Constructor_ValidValues_ShouldCreate(string value)
        {
            var name = new AlternativeName(value);
            Assert.Equal(value.Trim(), name.Value);
        }

        [Fact]
        public void Constructor_Trim_ShouldStoreTrimmedValue()
        {
            var name = new AlternativeName("   Acme Corp   ");
            Assert.Equal("Acme Corp", name.Value);
        }

        // ❌ Construtor — vazio/nulo/branco
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_NullOrWhiteSpace_ShouldThrow(string value)
        {
            var ex = Assert.Throws<ArgumentException>(() => new AlternativeName(value));
            Assert.Equal("value", ex.ParamName);
            Assert.Contains("cannot be empty", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        // ❌ Construtor — tamanho fora dos limites
        [Theory]
        [InlineData("AB")] // 2 chars (abaixo do mínimo)
        [InlineData("A")]  // 1 char
        public void Constructor_TooShort_ShouldThrow(string value)
        {
            var ex = Assert.Throws<ArgumentException>(() => new AlternativeName(value));
            Assert.Equal("value", ex.ParamName);
            Assert.Contains("between 3 and 100", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public void Constructor_TooLong_ShouldThrow()
        {
            var over100 = new string('A', 101);
            var ex = Assert.Throws<ArgumentException>(() => new AlternativeName(over100));
            Assert.Equal("value", ex.ParamName);
            Assert.Contains("between 3 and 100", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        [Fact]
        public void Constructor_MaxLength100_ShouldPass()
        {
            var exactly100 = new string('A', 100);
            var name = new AlternativeName(exactly100);
            Assert.Equal(exactly100, name.Value);
        }

        // ❌ Construtor — caracteres inválidos (regex só permite: A-Z a-z 0-9 espaço . , & ' ( ) -)
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
        [InlineData("Acme\"Corp")]
        [InlineData("Acme|Corp")]
        [InlineData("Åcme")]      // letra fora de A-Z ASCII
        [InlineData("Acme®")]     // símbolo
        public void Constructor_InvalidCharacters_ShouldThrow(string value)
        {
            var ex = Assert.Throws<ArgumentException>(() => new AlternativeName(value));
            Assert.Equal("value", ex.ParamName);
            Assert.Contains("invalid characters", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        // ✅ Equals — case-insensitive e semântica
        [Fact]
        public void Equals_SameTextDifferentCase_ShouldBeTrue()
        {
            var a = new AlternativeName("Acme Corp");
            var b = new AlternativeName("acme corp");

            Assert.True(a.Equals(b));
            Assert.True(a.Equals((object)b));
        }

        [Fact]
        public void Equals_DifferentText_ShouldBeFalse()
        {
            var a = new AlternativeName("Acme Corp");
            var b = new AlternativeName("Acme Group");

            Assert.False(a.Equals(b));
        }

        [Fact]
        public void Equals_NullOrDifferentType_ShouldBeFalse()
        {
            var a = new AlternativeName("Acme");
            Assert.False(a.Equals(null));
            Assert.False(a.Equals("Acme")); // tipo diferente
        }

        [Fact]
        public void Equals_SameReference_ShouldBeTrue()
        {
            var a = new AlternativeName("Acme");
            Assert.True(a.Equals(a));
        }

        // ✅ GetHashCode — consistente com Equals (case-insensitive)
        [Fact]
        public void GetHashCode_SameIgnoringCase_ShouldMatch()
        {
            var a = new AlternativeName("Acme Corp");
            var b = new AlternativeName("ACME CORP");

            Assert.Equal(a.GetHashCode(), b.GetHashCode());
        }

        [Fact]
        public void GetHashCode_DifferentValues_ShouldDiffer()
        {
            var a = new AlternativeName("Acme Corp");
            var b = new AlternativeName("Acme Group");

            Assert.NotEqual(a.GetHashCode(), b.GetHashCode());
        }

        // ✅ ToString
        [Fact]
        public void ToString_ShouldReturnValue()
        {
            var a = new AlternativeName("Acme & Partners");
            Assert.Equal("Acme & Partners", a.ToString());
        }
    }
}
