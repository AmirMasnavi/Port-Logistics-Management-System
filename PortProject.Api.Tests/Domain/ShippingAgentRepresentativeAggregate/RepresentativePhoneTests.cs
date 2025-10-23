using System;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ShippingAgentRepresentativeAggregate
{
    public class RepresentativePhoneTests
    {
        [Theory]
        [InlineData("912345678")]
        [InlineData("987654321")]
        [InlineData("999999999")]
        public void Constructor_ValidPhone_ShouldCreateSuccessfully(string validPhone)
        {
            // Act
            var phone = new RepresentativePhone(validPhone);

            // Assert
            Assert.Equal(validPhone, phone.Value);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData(null)]
        public void Constructor_EmptyOrNull_ShouldThrowArgumentException(string invalidPhone)
        {
            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => new RepresentativePhone(invalidPhone));
            Assert.Contains("Phone number cannot be empty", ex.Message);
        }

        [Theory]
        [InlineData("812345678")]   // não começa com 9
        [InlineData("91234567")]    // 8 dígitos
        [InlineData("9123456789")]  // 10 dígitos
        [InlineData("9ABCDEFGH")]   // letras
        [InlineData("91234 567")]   // espaço
        public void Constructor_InvalidFormat_ShouldThrowArgumentException(string invalidPhone)
        {
            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => new RepresentativePhone(invalidPhone));
            Assert.Contains("Invalid phone number. It must have 9 digits and start with 9.", ex.Message);
        }

        [Fact]
        public void Equals_SamePhone_ShouldReturnTrue()
        {
            // Arrange
            var p1 = new RepresentativePhone("912345678");
            var p2 = new RepresentativePhone("912345678");

            // Act & Assert
            Assert.True(p1.Equals(p2));
            Assert.Equal(p1.GetHashCode(), p2.GetHashCode());
        }

        [Fact]
        public void Equals_DifferentPhones_ShouldReturnFalse()
        {
            // Arrange
            var p1 = new RepresentativePhone("912345678");
            var p2 = new RepresentativePhone("987654321");

            // Act & Assert
            Assert.False(p1.Equals(p2));
            Assert.NotEqual(p1.GetHashCode(), p2.GetHashCode());
        }

        [Fact]
        public void ToString_ShouldReturnValue()
        {
            // Arrange
            var phone = new RepresentativePhone("912345678");

            // Act & Assert
            Assert.Equal("912345678", phone.ToString());
        }
    }
}
