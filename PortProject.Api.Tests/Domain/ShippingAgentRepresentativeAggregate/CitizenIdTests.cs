using System;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ShippingAgentRepresentativeAggregate
{
    public class CitizenIdTests
    {
        [Theory]
        [InlineData("12345678Z")]     // Portuguese Citizen Card
        [InlineData("ab1234567")]     // Passport (case-insensitive)
        [InlineData("ABC123XYZ9")]    // Generic alphanumeric (10 chars)
        public void Constructor_ValidValues_ShouldCreateSuccessfully(string validValue)
        {
            // Act
            var citizenId = new CitizenId(validValue);

            // Assert
            Assert.Equal(validValue.Trim().ToUpperInvariant(), citizenId.Value);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData(null)]
        public void Constructor_EmptyOrNull_ShouldThrowArgumentException(string invalidValue)
        {
            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => new CitizenId(invalidValue));
            Assert.Contains("Citizen ID is mandatory", ex.Message);
        }

        [Theory]
        [InlineData("1234567")]         // too short
        [InlineData("12345678ZZ")]      // too long for CC
        [InlineData("A123456")]         // invalid passport (1 letter only)
        [InlineData("AB12")]            // too short for passport
        [InlineData("!@#45678")]        // invalid chars
        public void Constructor_InvalidFormat_ShouldThrowArgumentException(string invalidValue)
        {
            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => new CitizenId(invalidValue));
            Assert.Contains("Invalid Citizen ID format", ex.Message);
        }

        [Fact]
        public void Equals_SameValueDifferentCase_ShouldBeEqual()
        {
            // Arrange
            var id1 = new CitizenId("ab1234567");
            var id2 = new CitizenId("AB1234567");

            // Act & Assert
            Assert.True(id1.Equals(id2));
            Assert.True(id1 == id2);
            Assert.False(id1 != id2);
        }

        [Fact]
        public void Equals_DifferentValues_ShouldNotBeEqual()
        {
            // Arrange
            var id1 = new CitizenId("12345678Z");
            var id2 = new CitizenId("12345679Z");

            // Act & Assert
            Assert.False(id1.Equals(id2));
            Assert.False(id1 == id2);
            Assert.True(id1 != id2);
        }

        [Fact]
        public void GetHashCode_ShouldBeCaseInsensitive()
        {
            // Arrange
            var id1 = new CitizenId("ab1234567");
            var id2 = new CitizenId("AB1234567");

            // Act & Assert
            Assert.Equal(id1.GetHashCode(), id2.GetHashCode());
        }

        [Fact]
        public void ToString_ShouldReturnValue()
        {
            // Arrange
            var id = new CitizenId("12345678Z");

            // Act & Assert
            Assert.Equal("12345678Z", id.ToString());
        }
    }
}
