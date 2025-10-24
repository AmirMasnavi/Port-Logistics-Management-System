using System;
using PortProject.Api.Domain.ResourceAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ResourceAggregate;

public class ResourceKindTest
{
    [Theory]
    [InlineData(ResourceKind.Crane)]
    [InlineData(ResourceKind.Truck)]
    [InlineData(ResourceKind.Other)]
    public void WhenUsingValidResourceKind_ThenEnumIsValid(ResourceKind kind)
    {
        // Act & Assert
        Assert.IsType<ResourceKind>(kind);
    }

    [Fact]
    public void WhenUsingInvalidResourceKind_ThenThrowsException()
    {
        // Arrange
        var invalidName = "INVALID";
        // Act & Assert
        Assert.Throws<ArgumentException>(() => Enum.Parse<ResourceKind>(invalidName));
    }
    
    [Fact]
    public void ResourceKind_ToString_ReturnsCorrectString()
    {
        // Crane test
        // Arrange
        var kind = ResourceKind.Crane;
        // Act
        var result = kind.ToString();
        // Assert
        Assert.Equal("Crane", result);
        
        // Truck test
        // Arrange
        kind = ResourceKind.Truck;
        // Act
        result = kind.ToString();
        // Assert
        Assert.Equal("Truck", result);
        
        // Other test
        // Arrange
        kind = ResourceKind.Other;
        // Act
        result = kind.ToString();
        // Assert
        Assert.Equal("Other", result);
    }
    
    [Fact]
    public void ResourceKind_Equals_WorksCorrectly()
    {
        // Arrange
        var kind1 = ResourceKind.Crane;
        var kind2 = ResourceKind.Crane;
        var kind3 = ResourceKind.Truck;
        
        // Act & Assert
        Assert.Equal(kind1, kind2);
        Assert.NotEqual(kind1, kind3);
    }
}