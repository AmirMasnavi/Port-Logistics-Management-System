using System;
using PortProject.Api.Domain.ResourceAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ResourceAggregate;

public class ResourceSetupTimeTest
{
    [Theory]
    [InlineData(0)]
    [InlineData(15)]
    [InlineData(30)]
    [InlineData(60)]
    public void WhenUsingValidSetupTime_ThenValueIsValid(int minutes)
    {
        // Arrange & Act
        var setupTime = new ResourceSetupTime(minutes);
        // Assert
        Assert.Equal(minutes, setupTime.Minutes);
    }
    
    
    [Theory]
    [InlineData(-5)]
    [InlineData(-1)]
    [InlineData(-10)]
    public void WhenUsingInvalidSetupTime_ThenThrowsException(int minutes)
    {
        // Act & Assert
        Assert.Throws<ArgumentOutOfRangeException>(() => new ResourceSetupTime(minutes));
    }

    [Fact]
    public void ResourceSetupTime_ToString_ReturnsCorrectString()
    {
        // Arrange
        var setupTime = new ResourceSetupTime(45);
        // Act
        var result = setupTime.ToString();
        // Assert
        Assert.Equal("45 minutes", result);
    }
}