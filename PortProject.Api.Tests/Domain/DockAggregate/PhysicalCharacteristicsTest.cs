using System;
using System.Globalization;
using PortProject.Api.Domain.DockAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.DockAggregate
{
    public class PhysicalCharacteristicsTest
    {
        // ===== Construtor =====

        [Theory]
        [InlineData(100, 10, 8)]
        [InlineData(250.5, 14.2, 11.8)]
        [InlineData(300, 15, 12)]
        public void WhenPassingCorrectData_ThenPhysicalCharacteristicsIsInstantiated(double length, double depth, double draft)
        {
            // Act
            var characteristics = new PhysicalCharacteristics(length, depth, draft);

            // Assert
            Assert.NotNull(characteristics);
            Assert.Equal(length, characteristics.LengthInMeters);
            Assert.Equal(depth, characteristics.DepthInMeters);
            Assert.Equal(draft, characteristics.MaxDraftInMeters);
        }

        [Theory]
        [InlineData(-1, 10, 8, "length")]
        [InlineData(100, -5, 8, "depth")]
        [InlineData(100, 10, -2, "maxDraft")]
        [InlineData(0, 10, 8, "length")]
        [InlineData(100, 0, 8, "depth")]
        [InlineData(100, 10, 0, "maxDraft")]
        public void WhenPassingZeroOrNegativeValues_ThenThrowsArgumentException(double length, double depth, double draft, string expectedParam)
        {
            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => new PhysicalCharacteristics(length, depth, draft));
            Assert.Equal(expectedParam, ex.ParamName, ignoreCase: true);
        }

        // ===== Equals =====

        [Fact]
        public void Equals_WithSameValues_ReturnsTrue()
        {
            // Arrange
            var p1 = new PhysicalCharacteristics(300, 15, 12);
            var p2 = new PhysicalCharacteristics(300, 15, 12);

            // Act & Assert
            Assert.True(p1.Equals(p2));
        }

        [Fact]
        public void Equals_WithDifferentValues_ReturnsFalse()
        {
            // Arrange
            var p1 = new PhysicalCharacteristics(300, 15, 12);
            var p2 = new PhysicalCharacteristics(310, 15, 12);
            var p3 = new PhysicalCharacteristics(300, 16, 12);
            var p4 = new PhysicalCharacteristics(300, 15, 13);

            // Act & Assert
            Assert.False(p1.Equals(p2));
            Assert.False(p1.Equals(p3));
            Assert.False(p1.Equals(p4));
        }

        [Fact]
        public void Equals_WithNull_ReturnsFalse()
        {
            // Arrange
            var p = new PhysicalCharacteristics(300, 15, 12);

            // Act & Assert
            Assert.False(p.Equals(null));
        }

        [Fact]
        public void Equals_WithDifferentType_ReturnsFalse()
        {
            // Arrange
            var p = new PhysicalCharacteristics(300, 15, 12);
            var otherObject = new object();

            // Act & Assert
            Assert.False(p.Equals(otherObject));
        }

        // ===== GetHashCode =====

        [Fact]
        public void GetHashCode_ReturnsCorrectHashCode()
        {
            // Arrange
            var p1 = new PhysicalCharacteristics(300, 15, 12);
            var p2 = new PhysicalCharacteristics(300, 15, 12);
            var p3 = new PhysicalCharacteristics(310, 15, 12);

            // Act & Assert
            Assert.Equal(p1.GetHashCode(), p2.GetHashCode());
            Assert.NotEqual(p1.GetHashCode(), p3.GetHashCode());
        }

        // ===== ToString =====

        [Fact]
        public void ToString_ReturnsFormattedString()
        {
            // Arrange
            var characteristics = new PhysicalCharacteristics(250, 14.5, 11);
            string expected = "Length: 250m, Depth: 14.5m, Max Draft: 11m";

            // Act
            var actual = string.Format(CultureInfo.InvariantCulture,
                "Length: {0}m, Depth: {1}m, Max Draft: {2}m",
                characteristics.LengthInMeters,
                characteristics.DepthInMeters,
                characteristics.MaxDraftInMeters
            );

            // Assert
            Assert.Equal(expected, actual);
        }
    }
}
