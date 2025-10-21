using System;
using PortProject.Api.Domain.StorageAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.StorageAggregate;

public class StorageAreaTypeTest
{
    [Theory]
    [InlineData(StorageAreaType.Yard)]
    [InlineData(StorageAreaType.Warehouse)]
    public void WhenUsingValidStorageAreaType_ThenEnumIsValid(StorageAreaType areaType)
    {
        // Act & Assert
        Assert.IsType<StorageAreaType>(areaType);
    }

    [Fact]
    public void WhenUsingInvalidStorageAreaType_ThenThrowsException()
    {
        // Arrange
        var invalidName = "INVALID";
        // Act & Assert
        Assert.Throws<ArgumentException>(() => Enum.Parse<StorageAreaType>(invalidName));
    }
    
    [Fact]
    public void StorageAreaType_ToString_ReturnsCorrectString()
    {
        // Warehouse test
        // Arrange
        var areaType = StorageAreaType.Warehouse;
        // Act
        var result = areaType.ToString();
        // Assert
        Assert.Equal("Warehouse", result);
        
        // Yard test
        // Arrange
        areaType = StorageAreaType.Yard;
        // Act
        result = areaType.ToString();
        // Assert
        Assert.Equal("Yard", result);
    }
    
    [Fact]
    public void StorageAreaType_Equals_WorksCorrectly()
    {
        // Arrange
        var areaType1 = StorageAreaType.Warehouse;
        var areaType2 = StorageAreaType.Warehouse;
        var areaType3 = StorageAreaType.Yard;
        
        // Act & Assert
        Assert.Equal(areaType1, areaType2);
        Assert.NotEqual(areaType1, areaType3);
    }
}