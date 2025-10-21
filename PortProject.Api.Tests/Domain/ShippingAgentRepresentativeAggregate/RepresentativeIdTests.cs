using System;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ShippingAgentRepresentativeAggregate
{
    public class RepresentativeIdTests
    {
        [Fact]
        public void Constructor_ValidGuid_ShouldCreateSuccessfully()
        {
            // Arrange
            var guid = Guid.NewGuid();

            // Act
            var repId = new RepresentativeId(guid);

            // Assert
            Assert.Equal(guid, repId.Value);
        }

        [Fact]
        public void Constructor_EmptyGuid_ShouldThrowArgumentException()
        {
            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => new RepresentativeId(Guid.Empty));
            Assert.Contains("RepresentativeId cannot be empty", ex.Message);
        }

        [Fact]
        public void NewId_ShouldGenerateUniqueNonEmptyGuid()
        {
            // Act
            var repId1 = RepresentativeId.NewId();
            var repId2 = RepresentativeId.NewId();

            // Assert
            Assert.NotEqual(repId1.Value, Guid.Empty);
            Assert.NotEqual(repId2.Value, Guid.Empty);
            Assert.NotEqual(repId1.Value, repId2.Value);
        }

        [Fact]
        public void Equals_SameGuid_ShouldReturnTrue()
        {
            // Arrange
            var guid = Guid.NewGuid();
            var repId1 = new RepresentativeId(guid);
            var repId2 = new RepresentativeId(guid);

            // Act & Assert
            Assert.True(repId1.Equals(repId2));
            Assert.Equal(repId1.GetHashCode(), repId2.GetHashCode());
        }

        [Fact]
        public void Equals_DifferentGuids_ShouldReturnFalse()
        {
            // Arrange
            var repId1 = new RepresentativeId(Guid.NewGuid());
            var repId2 = new RepresentativeId(Guid.NewGuid());

            // Act & Assert
            Assert.False(repId1.Equals(repId2));
            Assert.NotEqual(repId1.GetHashCode(), repId2.GetHashCode());
        }

        [Fact]
        public void ToString_ShouldReturnGuidAsString()
        {
            // Arrange
            var guid = Guid.NewGuid();
            var repId = new RepresentativeId(guid);

            // Act
            var result = repId.ToString();

            // Assert
            Assert.Equal(guid.ToString(), result);
        }
    }
}
