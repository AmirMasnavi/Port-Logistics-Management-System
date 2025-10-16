using System;
using src.Domain.VesselTypeAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.VesselTypeAggregate;

public class VesselTypeCapacityTest
{
    [Theory]
    [InlineData(0)]
    [InlineData(100)]
    [InlineData(99999)]
    public void WhenPassingCorrectData_ThenVesselTypeCapacityIsInstantiated(int value)
    {
        // Act
        var capacity = new VesselTypeCapacity(value);

        // Assert
        Assert.NotNull(capacity);
        Assert.Equal(value, capacity.Value);
    }

    [Fact]
    public void WhenPassingNegativeValue_ThenThrowsArgumentException()
    {
        // Arrange
        int invalidValue = -1;

        // Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            // Act
            new VesselTypeCapacity(invalidValue)
        );
        Assert.Equal("VesselType capacity cannot be negative. (Parameter 'value')", ex.Message);
        Assert.Equal("value", ex.ParamName);
    }

    [Fact]
    public void Equals_WithSameValue_ReturnsTrue()
    {
        // Arrange
        var capacity1 = new VesselTypeCapacity(100);
        var capacity2 = new VesselTypeCapacity(100);

        // Act & Assert
        Assert.True(capacity1.Equals(capacity2));
        // Se tiver sobrecarga do operador ==
        // Assert.True(capacity1 == capacity2);
    }

    [Fact]
    public void Equals_WithDifferentValue_ReturnsFalse()
    {
        // Arrange
        var capacity1 = new VesselTypeCapacity(100);
        var capacity2 = new VesselTypeCapacity(200);

        // Act & Assert
        Assert.False(capacity1.Equals(capacity2));
        // Se tiver sobrecarga do operador ==
        // Assert.False(capacity1 == capacity2);
    }

    [Fact]
    public void Equals_WithNull_ReturnsFalse()
    {
        // Arrange
        var capacity = new VesselTypeCapacity(100);

        // Act & Assert
        Assert.False(capacity.Equals(null));
    }

    [Fact]
    public void Equals_WithDifferentType_ReturnsFalse()
    {
        // Arrange
        var capacity = new VesselTypeCapacity(100);
        var otherObject = new object();

        // Act & Assert
        Assert.False(capacity.Equals(otherObject));
    }

    [Fact]
    public void GetHashCode_ReturnsCorrectHashCode()
    {
        // Arrange
        var capacity1 = new VesselTypeCapacity(100);
        var capacity2 = new VesselTypeCapacity(100);
        var capacity3 = new VesselTypeCapacity(200);

        // Act & Assert
        Assert.Equal(capacity1.GetHashCode(), capacity2.GetHashCode());
        Assert.NotEqual(capacity1.GetHashCode(), capacity3.GetHashCode());
    }

    [Fact]
    public void ToString_ReturnsValueAsString()
    {
        // Arrange
        var capacity = new VesselTypeCapacity(123);
        string expected = "123";

        // Act
        var actual = capacity.ToString();

        // Assert
        Assert.Equal(expected, actual);
    }
}
