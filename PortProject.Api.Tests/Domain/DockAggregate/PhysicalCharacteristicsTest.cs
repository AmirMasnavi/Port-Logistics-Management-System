using Xunit;
using System;
using PortProject.Api.Domain.DockAggregate;

namespace PortProject.Api.Tests.Domain.DockAggregate
{
    public class PhysicalCharacteristicsTest
    {
        // ===== Construtor =====

        [Fact]
        public void WhenAllValuesAreValid_ThenObjectIsCreated()
        {
            // Act
            var characteristics = new PhysicalCharacteristics(300, 15, 12);

            // Assert
            Assert.Equal(300, characteristics.LengthInMeters);
            Assert.Equal(15, characteristics.DepthInMeters);
            Assert.Equal(12, characteristics.MaxDraftInMeters);
        }

        [Theory]
        [InlineData(0, 10, 10, "length")]
        [InlineData(-5, 10, 10, "length")]
        [InlineData(10, 0, 10, "depth")]
        [InlineData(10, -2, 10, "depth")]
        [InlineData(10, 10, 0, "maxDraft")]
        [InlineData(10, 10, -1, "maxDraft")]
        public void WhenAnyValueIsZeroOrNegative_ThenThrowsArgumentException(double length, double depth, double draft, string expectedParam)
        {
            // Act
            var ex = Assert.Throws<ArgumentException>(() => new PhysicalCharacteristics(length, depth, draft));

            // Assert
            Assert.Equal(expectedParam, ex.ParamName, ignoreCase: true);
            Assert.Contains("greater than zero", ex.Message);
        }

        // ===== Equals =====

        [Fact]
        public void Equals_ReturnsTrue_WhenValuesAreIdentical()
        {
            // Arrange
            var p1 = new PhysicalCharacteristics(300, 15, 12);
            var p2 = new PhysicalCharacteristics(300, 15, 12);

            // Act
            var result = p1.Equals(p2);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public void Equals_ReturnsFalse_WhenAnyValueDiffers()
        {
            // Arrange
            var p1 = new PhysicalCharacteristics(300, 15, 12);
            var p2 = new PhysicalCharacteristics(310, 15, 12);

            // Act
            var result = p1.Equals(p2);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public void Equals_ReturnsFalse_WhenComparingWithNullOrDifferentType()
        {
            // Arrange
            var p = new PhysicalCharacteristics(100, 10, 8);

            // Assert
            Assert.False(p.Equals(null));
            Assert.False(p.Equals("string"));
        }

        // ===== GetHashCode =====

        [Fact]
        public void GetHashCode_IsConsistent_ForEqualObjects()
        {
            // Arrange
            var p1 = new PhysicalCharacteristics(200, 15, 12);
            var p2 = new PhysicalCharacteristics(200, 15, 12);

            // Act
            var hash1 = p1.GetHashCode();
            var hash2 = p2.GetHashCode();

            // Assert
            Assert.Equal(hash1, hash2);
        }

        [Fact]
        public void GetHashCode_Differs_ForDifferentObjects()
        {
            // Arrange
            var p1 = new PhysicalCharacteristics(100, 10, 8);
            var p2 = new PhysicalCharacteristics(120, 12, 9);

            // Act
            var hash1 = p1.GetHashCode();
            var hash2 = p2.GetHashCode();

            // Assert
            Assert.NotEqual(hash1, hash2);
        }

        // ===== ToString =====

        [Fact]
        public void ToString_ReturnsExpectedFormat()
        {
            // Arrange
            var characteristics = new PhysicalCharacteristics(250, 14.5, 11);

            // Act
            var result = characteristics.ToString();

            // Assert
            Assert.Equal("Length: 250m, Depth: 14.5m, Max Draft: 11m", result);
        }
    }
}
