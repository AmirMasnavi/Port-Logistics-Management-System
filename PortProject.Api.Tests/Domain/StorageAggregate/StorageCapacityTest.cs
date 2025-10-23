using System;
using PortProject.Api.Domain.StorageAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.StorageAggregate;

public class StorageCapacityTest
{
    [Theory]
    [InlineData(1)]
    [InlineData(100)]
    [InlineData(99999)]
    
    public void WhenPassingCorrectData_ThenStorageCapacityIsInstantiated(int value)
    {
        // Act
        var capacity = new StorageCapacity(value);

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
            new StorageCapacity(invalidValue)
        );
        Assert.Equal("Capacity must be a positive integer!", ex.Message);
    }


    [Fact]
    public void Equals_WithSameValue_ReturnsTrue()
    {
        // Arrange
        var capacity1 = new StorageCapacity(100);
        var capacity2 = new StorageCapacity(100);
        // Act & Assert
        Assert.Equal(capacity1.ToString(), capacity2.ToString());
    }

    [Fact]
    public void Equals_WithDifferentValue_ReturnsFalse()
    {
        // Arrange
        var capacity1 = new StorageCapacity(100);
        var capacity2 = new StorageCapacity(200);
        // Act & Assert
        Assert.False(capacity1.Equals(capacity2));
    }
    
    [Fact]
    public void ToString_ReturnsValueAsString()
    {
        // Arrange
        var capacity = new StorageCapacity(150);

        // Act
        var result = capacity.ToString();

        // Assert
        Assert.Equal("150", result);
    }
}