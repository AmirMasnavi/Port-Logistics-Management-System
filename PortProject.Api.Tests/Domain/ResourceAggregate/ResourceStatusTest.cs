using System;
using PortProject.Api.Domain.ResourceAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ResourceAggregate;

public class ResourceStatusTest
{
    [Theory]
    [InlineData(ResourceStatus.Active)]
    [InlineData(ResourceStatus.Inactive)]
    [InlineData(ResourceStatus.UnderMaintenance)]
    public void WhenUsingValidResourceStatus_ThenEnumIsValid(ResourceStatus status)
    {
        // Act & Assert
        Assert.IsType<ResourceStatus>(status);
    }

    [Fact]
    public void WhenUsingInvalidResourceStatus_ThenThrowsException()
    {
        // Arrange
        var invalidName = "INVALID";
        // Act & Assert
        Assert.Throws<ArgumentException>(() => Enum.Parse<ResourceStatus>(invalidName));
    }

    [Fact]
    public void ResourceStatus_ToString_ReturnsCorrectString()
    {
        // Active test
        // Arrange
        var status = ResourceStatus.Active;
        // Act
        var result = status.ToString();
        // Assert
        Assert.Equal("Active", result);

        // Inactive test
        // Arrange
        status = ResourceStatus.Inactive;
        // Act
        result = status.ToString();
        // Assert
        Assert.Equal("Inactive", result);
        
        
        // UnderMaintenance test
        // Arrange
        status = ResourceStatus.UnderMaintenance;
        // Act
        result = status.ToString();
        // Assert
        Assert.Equal("UnderMaintenance", result);
    }

    [Fact]
    public void ResourceStatus_Equals_WorksCorrectly()
    {
        // Arrange
        var status1 = ResourceStatus.Active;
        var status2 = ResourceStatus.Active;
        var status3 = ResourceStatus.Inactive;

        // Act & Assert
        Assert.Equal(status1, status2);
        Assert.NotEqual(status1, status3);
    }
}