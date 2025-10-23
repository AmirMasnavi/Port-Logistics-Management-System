using System;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ShippingAgentOrganizationAggregate
{
    public class OrganizationIdTests
    {
        // ✅ Construtor — casos válidos
        [Fact]
        public void Constructor_ValidGuid_ShouldCreateInstance()
        {
            var guid = Guid.NewGuid();

            var orgId = new OrganizationId(guid);

            Assert.Equal(guid, orgId.Value);
        }

        // ❌ Construtor — Guid.Empty deve lançar exceção
        [Fact]
        public void Constructor_EmptyGuid_ShouldThrow()
        {
            var ex = Assert.Throws<ArgumentException>(() => new OrganizationId(Guid.Empty));
            Assert.Equal("value", ex.ParamName);
            Assert.Contains("cannot be empty", ex.Message, StringComparison.OrdinalIgnoreCase);
        }

        // ✅ NewId() — deve gerar novo Guid válido e não vazio
        [Fact]
        public void NewId_ShouldReturnNewGuid()
        {
            var orgId = OrganizationId.NewId();

            Assert.NotEqual(Guid.Empty, orgId.Value);
        }

        [Fact]
        public void NewId_ShouldReturnDifferentGuidsEachTime()
        {
            var a = OrganizationId.NewId();
            var b = OrganizationId.NewId();

            Assert.NotEqual(a.Value, b.Value);
        }

        // ✅ Equals() — mesmo valor deve ser igual
        [Fact]
        public void Equals_SameGuid_ShouldReturnTrue()
        {
            var guid = Guid.NewGuid();
            var a = new OrganizationId(guid);
            var b = new OrganizationId(guid);

            Assert.True(a.Equals(b));
            Assert.True(a.Equals((object)b));
        }

        [Fact]
        public void Equals_DifferentGuid_ShouldReturnFalse()
        {
            var a = new OrganizationId(Guid.NewGuid());
            var b = new OrganizationId(Guid.NewGuid());

            Assert.False(a.Equals(b));
        }

        [Fact]
        public void Equals_Null_ShouldReturnFalse()
        {
            var a = new OrganizationId(Guid.NewGuid());
            Assert.False(a.Equals(null));
        }

        [Fact]
        public void Equals_SameReference_ShouldReturnTrue()
        {
            var a = new OrganizationId(Guid.NewGuid());
            Assert.True(a.Equals(a));
        }

        [Fact]
        public void Equals_DifferentType_ShouldReturnFalse()
        {
            var a = new OrganizationId(Guid.NewGuid());
            Assert.False(a.Equals("some string"));
        }

        // ✅ Operadores == e !=
        [Fact]
        public void Operator_Equality_SameGuid_ShouldBeTrue()
        {
            var guid = Guid.NewGuid();
            var a = new OrganizationId(guid);
            var b = new OrganizationId(guid);

            Assert.True(a == b);
            Assert.False(a != b);
        }

        [Fact]
        public void Operator_Equality_DifferentGuid_ShouldBeFalse()
        {
            var a = new OrganizationId(Guid.NewGuid());
            var b = new OrganizationId(Guid.NewGuid());

            Assert.False(a == b);
            Assert.True(a != b);
        }

        [Fact]
        public void Operator_Equality_NullComparison_ShouldWorkCorrectly()
        {
            OrganizationId a = null;
            OrganizationId b = null;
            OrganizationId c = new OrganizationId(Guid.NewGuid());

            Assert.True(a == b);
            Assert.False(a == c);
            Assert.True(a != c);
        }

        // ✅ GetHashCode — coerente com Equals
        [Fact]
        public void GetHashCode_SameGuid_ShouldBeEqual()
        {
            var guid = Guid.NewGuid();
            var a = new OrganizationId(guid);
            var b = new OrganizationId(guid);

            Assert.Equal(a.GetHashCode(), b.GetHashCode());
        }

        [Fact]
        public void GetHashCode_DifferentGuid_ShouldBeDifferent()
        {
            var a = new OrganizationId(Guid.NewGuid());
            var b = new OrganizationId(Guid.NewGuid());

            Assert.NotEqual(a.GetHashCode(), b.GetHashCode());
        }

        // ✅ ToString
        [Fact]
        public void ToString_ShouldReturnGuidString()
        {
            var guid = Guid.NewGuid();
            var orgId = new OrganizationId(guid);

            Assert.Equal(guid.ToString(), orgId.ToString());
        }
    }
}
