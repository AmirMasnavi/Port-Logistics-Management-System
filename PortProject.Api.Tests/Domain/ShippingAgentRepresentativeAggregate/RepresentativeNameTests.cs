using System;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ShippingAgentRepresentativeAggregate
{
    public class RepresentativeNameTests
    {
        [Theory]
        [InlineData("John Doe")]
        [InlineData("Maria Silva")]
        [InlineData("Afonso")]
        [InlineData("Érica Santos")]
        public void Constructor_ValidName_ShouldCreateSuccessfully(string validName)
        {
            // Act
            var name = new RepresentativeName(validName);

            // Assert
            Assert.Equal(validName, name.Value);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData(null)]
        public void Constructor_EmptyOrNull_ShouldThrowArgumentException(string invalidName)
        {
            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => new RepresentativeName(invalidName));
            Assert.Contains("RepresentativeName cannot be empty", ex.Message);
        }

        [Fact]
        public void Equals_SameName_ShouldReturnTrue()
        {
            // Arrange
            var n1 = new RepresentativeName("John Doe");
            var n2 = new RepresentativeName("John Doe");

            // Act & Assert
            Assert.True(n1.Equals(n2));
            Assert.Equal(n1.GetHashCode(), n2.GetHashCode());
        }

        [Fact]
        public void Equals_DifferentNames_ShouldReturnFalse()
        {
            // Arrange
            var n1 = new RepresentativeName("John Doe");
            var n2 = new RepresentativeName("Jane Doe");

            // Act & Assert
            Assert.False(n1.Equals(n2));
            Assert.NotEqual(n1.GetHashCode(), n2.GetHashCode());
        }

        [Fact]
        public void ToString_ShouldReturnValue()
        {
            // Arrange
            var name = new RepresentativeName("John Doe");

            // Act & Assert
            Assert.Equal("John Doe", name.ToString());
        }
    }
}
