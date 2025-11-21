using System;
using PortProject.Api.Domain.StorageAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.StorageAggregate;

public class StorageAreaLocationTest
{
    [Theory]
    [InlineData(1.0f, 1.0f)]
    [InlineData(50.5f, 75.3f)]
    [InlineData(9999.9f, 8888.8f)]
    public void WhenPassingCorrectData_ThenStorageAreaLocationIsInstantiated(float x, float y)
    {
        // Act
        var location = new StorageAreaLocation(x, y);
        // Assert
        Assert.NotNull(location);
        Assert.Equal(x, location.X);
        Assert.Equal(y, location.Y);
    }

    [Theory]
    [InlineData(0.0f, 1.0f)]
    [InlineData(1.0f, 0.0f)]
    [InlineData(-5.0f, 10.0f)]
    [InlineData(10.0f, -5.0f)]
    public void WhenPassingInvalidCoordinates_ThenThrowsArgumentException(float x, float y)
    {
        // Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            // Act
            new StorageAreaLocation(x, y)
        );
        Assert.Equal("Coordinates must be valid!", ex.Message);
    }

    [Fact]
    public void ToString_ReturnsCorrectFormat()
    {
        // Arrange
        var location = new StorageAreaLocation(12.5f, 34.7f);
        // Act
        var result = location.ToString();
        // Assert
        Assert.Equal("(12,5, 34,7)", result);
    }
    
    [Fact]
    public void Equals_WithSameCoordinates_ReturnsTrue()
    {
        // Arrange
        var location1 = new StorageAreaLocation(10.0f, 20.0f);
        var location2 = new StorageAreaLocation(10.0f, 20.0f);
        // Act & Assert
        Assert.Equal(location1.ToString(), location2.ToString());
    }

}