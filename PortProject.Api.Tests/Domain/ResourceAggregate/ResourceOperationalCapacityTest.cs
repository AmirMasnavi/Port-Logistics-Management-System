using System;
using PortProject.Api.Domain.ResourceAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.ResourceAggregate;

public class ResourceOperationalCapacityTest
{
    [Fact]
    public void ForCrane_WithValidAverage_CreatesCraneCapacity()
    {
        // Arrange
        var avgPerHour = 30;

        // Act
        var capacity = ResourceOperationalCapacity.ForCrane(avgPerHour);

        // Assert
        Assert.Equal(ResourceKind.Crane, capacity.Kind);
        Assert.Equal(avgPerHour, capacity.AverageContainersPerHour);
        Assert.Null(capacity.ContainersPerTrip);
        Assert.Null(capacity.AverageSpeedKmh);
        Assert.Null(capacity.Unit);
        Assert.Null(capacity.GenericValue);
        Assert.Equal("Crane: 30 avg containers/hour", capacity.ToString());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-100)]
    public void ForCrane_WithNonPositiveAverage_Throws(int avgPerHour)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => ResourceOperationalCapacity.ForCrane(avgPerHour));
    }

    [Fact]
    public void ForTruck_WithValidValues_CreatesTruckCapacity()
    {
        // Arrange
        var containersPerTrip = 2;
        var averageSpeedKmh = 60d;

        // Act
        var capacity = ResourceOperationalCapacity.ForTruck(containersPerTrip, averageSpeedKmh);

        // Assert
        Assert.Equal(ResourceKind.Truck, capacity.Kind);
        Assert.Equal(containersPerTrip, capacity.ContainersPerTrip);
        Assert.Equal(averageSpeedKmh, capacity.AverageSpeedKmh);
        Assert.Null(capacity.AverageContainersPerHour);
        Assert.Null(capacity.Unit);
        Assert.Null(capacity.GenericValue);
        Assert.Equal("Truck: 2 containers/trip @ 60 km/h", capacity.ToString());
    }

    [Theory]
    [InlineData(0, 10d)]
    [InlineData(-1, 10d)]
    public void ForTruck_WithNonPositiveContainers_Throws(int containersPerTrip, double speed)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => ResourceOperationalCapacity.ForTruck(containersPerTrip, speed));
    }

    [Theory]
    [InlineData(1, 0d)]
    [InlineData(1, -5d)]
    public void ForTruck_WithNonPositiveSpeed_Throws(int containersPerTrip, double speed)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => ResourceOperationalCapacity.ForTruck(containersPerTrip, speed));
    }

    [Fact]
    public void ForOther_WithValidValues_CreatesOtherCapacity()
    {
        // Arrange
        var unit = "tons/day";
        var value = 10d;

        // Act
        var capacity = ResourceOperationalCapacity.ForOther(unit, value);

        // Assert
        Assert.Equal(ResourceKind.Other, capacity.Kind);
        Assert.Equal(unit, capacity.Unit);
        Assert.Equal(value, capacity.GenericValue);
        Assert.Null(capacity.AverageContainersPerHour);
        Assert.Null(capacity.ContainersPerTrip);
        Assert.Null(capacity.AverageSpeedKmh);
        Assert.Equal("Other: 10 tons/day", capacity.ToString());
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public void ForOther_WithNullOrWhitespaceUnit_Throws(string? unit)
    {
        Assert.Throws<ArgumentException>(() => ResourceOperationalCapacity.ForOther(unit!, 1));
    }

    [Theory]
    [InlineData(0d)]
    [InlineData(-1d)]
    public void ForOther_WithNonPositiveValue_Throws(double value)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => ResourceOperationalCapacity.ForOther("u", value));
    }
}