using System;
using src.Domain.VesselTypeAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.VesselTypeAggregate;

public class VesselTypeDimensionsTest
{
    [Theory]
    [InlineData(0, 0, 0)]
    [InlineData(10, 5, 8)]
    [InlineData(100, 20, 30)]
    public void WhenPassingCorrectData_ThenVesselTypeDimensionsIsInstantiated(int rows, int bays, int tiers)
    {
        // Act
        var dimensions = new VesselTypeDimensions(rows, bays, tiers);

        // Assert
        Assert.NotNull(dimensions);
        Assert.Equal(rows, dimensions.MaxRows);
        Assert.Equal(bays, dimensions.MaxBays);
        Assert.Equal(tiers, dimensions.MaxTiers);
    }

    [Theory]
    [InlineData(-1, 5, 8)]
    [InlineData(10, -1, 8)]
    [InlineData(10, 5, -1)]
    [InlineData(-1, -1, -1)]
    public void WhenPassingNegativeValues_ThenThrowsArgumentException(int rows, int bays, int tiers)
    {
        // Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            // Act
            new VesselTypeDimensions(rows, bays, tiers)
        );
        Assert.Equal("Rows, bays, and tiers cannot be negative.", ex.Message);
    }

    [Fact]
    public void Equals_WithSameValues_ReturnsTrue()
    {
        // Arrange
        var dimensions1 = new VesselTypeDimensions(10, 5, 8);
        var dimensions2 = new VesselTypeDimensions(10, 5, 8);

        // Act & Assert
        Assert.True(dimensions1.Equals(dimensions2));
        // Se tiver sobrecarga do operador ==
        // Assert.True(dimensions1 == dimensions2);
    }

    [Fact]
    public void Equals_WithDifferentValues_ReturnsFalse()
    {
        // Arrange
        var dimensions1 = new VesselTypeDimensions(10, 5, 8);
        var dimensions2 = new VesselTypeDimensions(11, 5, 8);
        var dimensions3 = new VesselTypeDimensions(10, 6, 8);
        var dimensions4 = new VesselTypeDimensions(10, 5, 9);

        // Act & Assert
        Assert.False(dimensions1.Equals(dimensions2));
        Assert.False(dimensions1.Equals(dimensions3));
        Assert.False(dimensions1.Equals(dimensions4));
        // Se tiver sobrecarga do operador ==
        // Assert.False(dimensions1 == dimensions2);
    }

    [Fact]
    public void Equals_WithNull_ReturnsFalse()
    {
        // Arrange
        var dimensions = new VesselTypeDimensions(10, 5, 8);

        // Act & Assert
        Assert.False(dimensions.Equals(null));
    }

    [Fact]
    public void Equals_WithDifferentType_ReturnsFalse()
    {
        // Arrange
        var dimensions = new VesselTypeDimensions(10, 5, 8);
        var otherObject = new object();

        // Act & Assert
        Assert.False(dimensions.Equals(otherObject));
    }

    [Fact]
    public void GetHashCode_ReturnsCorrectHashCode()
    {
        // Arrange
        var dimensions1 = new VesselTypeDimensions(10, 5, 8);
        var dimensions2 = new VesselTypeDimensions(10, 5, 8);
        var dimensions3 = new VesselTypeDimensions(11, 5, 8);

        // Act & Assert
        Assert.Equal(dimensions1.GetHashCode(), dimensions2.GetHashCode());
        Assert.NotEqual(dimensions1.GetHashCode(), dimensions3.GetHashCode());
    }

    [Fact]
    public void ToString_ReturnsFormattedString()
    {
        // Arrange
        var dimensions = new VesselTypeDimensions(10, 5, 8);
        string expected = "Rows: 10, Bays: 5, Tiers: 8";

        // Act
        var actual = dimensions.ToString();

        // Assert
        Assert.Equal(expected, actual);
    }
}
