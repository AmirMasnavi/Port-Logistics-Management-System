using System;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ShippingAgentRepresentativeAggregate
{
    public class RepresentativeEmailTests
    {
        [Theory]
        [InlineData("john.doe@example.com")]
        [InlineData("user123@domain.pt")]
        [InlineData("name.surname@company.co.uk")]
        [InlineData("test@email.com")]
        public void Constructor_ValidEmails_ShouldCreateSuccessfully(string validEmail)
        {
            // Act
            var email = new RepresentativeEmail(validEmail);

            // Assert
            Assert.Equal(validEmail, email.Value);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData(null)]
        public void Constructor_EmptyOrNull_ShouldThrowArgumentException(string invalidEmail)
        {
            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => new RepresentativeEmail(invalidEmail));
            Assert.Contains("Email cannot be empty", ex.Message);
        }

        [Theory]
        [InlineData("plainaddress")]
        [InlineData("missingatsign.com")]
        [InlineData("missingdomain@")]
        [InlineData("@missinguser.com")]
        [InlineData("user@.com")]
        [InlineData("user@domain")]
        [InlineData("user@domain,com")]
        [InlineData("user@ domain.com")]
        public void Constructor_InvalidFormat_ShouldThrowArgumentException(string invalidEmail)
        {
            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => new RepresentativeEmail(invalidEmail));
            Assert.Contains("Invalid email format", ex.Message);
        }

        [Fact]
        public void Equals_SameEmail_ShouldBeEqual()
        {
            // Arrange
            var e1 = new RepresentativeEmail("john@example.com");
            var e2 = new RepresentativeEmail("john@example.com");

            // Act & Assert
            Assert.True(e1.Equals(e2));
            Assert.Equal(e1.GetHashCode(), e2.GetHashCode());
        }

        [Fact]
        public void Equals_DifferentEmails_ShouldNotBeEqual()
        {
            // Arrange
            var e1 = new RepresentativeEmail("john@example.com");
            var e2 = new RepresentativeEmail("mary@example.com");

            // Act & Assert
            Assert.False(e1.Equals(e2));
            Assert.NotEqual(e1.GetHashCode(), e2.GetHashCode());
        }

        [Fact]
        public void ToString_ShouldReturnValue()
        {
            // Arrange
            var email = new RepresentativeEmail("user@domain.com");

            // Act & Assert
            Assert.Equal("user@domain.com", email.ToString());
        }
    }
}
