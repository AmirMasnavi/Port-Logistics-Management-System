using System;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ShippingAgentRepresentativeAggregate
{
    public class RepresentativeNationalityTests
    {
        [Theory]
        [InlineData("Portuguese")]
        [InlineData("Spanish")]
        [InlineData("French")]
        [InlineData("Brazilian")]
        public void Constructor_ValidNationality_ShouldCreateSuccessfully(string validValue)
        {
            // Act
            var nationality = new RepresentativeNationality(validValue);

            // Assert
            Assert.Equal(validValue, nationality.Value);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData(null)]
        public void Constructor_EmptyOrNull_ShouldThrowArgumentException(string invalidValue)
        {
            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => new RepresentativeNationality(invalidValue));
            Assert.Contains("CitizenId cannot be empty", ex.Message);
        }

        [Fact]
        public void GetHashCode_ShouldReturnSameValueForSameNationality()
        {
            // Arrange
            var n1 = new RepresentativeNationality("Portuguese");
            var n2 = new RepresentativeNationality("Portuguese");

            // Act & Assert
            Assert.Equal(n1.GetHashCode(), n2.GetHashCode());
        }

        [Fact]
        public void GetHashCode_ShouldReturnDifferentValueForDifferentNationalities()
        {
            // Arrange
            var n1 = new RepresentativeNationality("Portuguese");
            var n2 = new RepresentativeNationality("Spanish");

            // Act & Assert
            Assert.NotEqual(n1.GetHashCode(), n2.GetHashCode());
        }

        [Fact]
        public void ToString_ShouldReturnValue()
        {
            // Arrange
            var nationality = new RepresentativeNationality("Portuguese");

            // Act & Assert
            Assert.Equal("Portuguese", nationality.ToString());
        }
    }
}
