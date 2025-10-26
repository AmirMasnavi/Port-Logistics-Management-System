using System;
using PortProject.Api.Domain.StorageAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.StorageAggregate;

public class StorageAreaTest
{
    [Fact]
    public void WhenPassingCorrectDataToConstructor_ThenStorageAreaIsCreated()
    {
        // Arrange
        var location = new StorageAreaLocation(10f, 20f);
        var type = StorageAreaType.Warehouse;
        var capacity = new StorageCapacity(500);

        // Act
        var storageArea = new StorageArea(location, type, capacity);

        // Assert
        Assert.Equal(location, storageArea.Location);
        Assert.Equal(type, storageArea.Type);
        Assert.Equal(capacity, storageArea.Capacity);
    }

    [Fact]
    public void Constructor_WithNullLocation_Throws()
    {
        var capacity = new StorageCapacity(100);
        var ex = Assert.Throws<ArgumentNullException>(() => new StorageArea(null, StorageAreaType.Yard, capacity));
        Assert.Equal("location", ex.ParamName);
    }

    [Fact]
    public void Constructor_WithNullCapacity_Throws()
    {
        var location = new StorageAreaLocation(1f, 1f);
        var ex = Assert.Throws<NullReferenceException>(() => new StorageArea(location, StorageAreaType.Yard, null));
    }

    [Fact]
    public void ConvenienceConstructor_DefaultsTypeToYard()
    {
        var location = new StorageAreaLocation(3f, 4f);
        var capacity = new StorageCapacity(200);

        var storageArea = new StorageArea(location, capacity);

        Assert.Equal(StorageAreaType.Yard, storageArea.Type);
        Assert.Equal(location, storageArea.Location);
        Assert.Equal(capacity, storageArea.Capacity);
    }

    [Fact]
    public void ChangeLocation_UpdatesLocation()
    {
        var storageArea = BuildDefaultStorageArea();
        var newLocation = new StorageAreaLocation(50f, 60f);

        storageArea.ChangeLocation(newLocation);

        Assert.Equal(newLocation, storageArea.Location);
    }

    [Fact]
    public void ChangeLocation_WithNull_Throws()
    {
        var storageArea = BuildDefaultStorageArea();
        var ex = Assert.Throws<ArgumentNullException>(() => storageArea.ChangeLocation(null));
        Assert.Equal("newLocation", ex.ParamName);
    }

    [Fact]
    public void ChangeType_WithValidEnum_UpdatesType()
    {
        var storageArea = BuildDefaultStorageArea();

        storageArea.ChangeType(StorageAreaType.Warehouse);
        Assert.Equal(StorageAreaType.Warehouse, storageArea.Type);

        storageArea.ChangeType(StorageAreaType.Yard);
        Assert.Equal(StorageAreaType.Yard, storageArea.Type);
    }

    [Fact]
    public void ChangeType_WithInvalidEnum_Throws()
    {
        var storageArea = BuildDefaultStorageArea();
        var invalid = (StorageAreaType)999;

        var ex = Assert.Throws<ArgumentException>(() => storageArea.ChangeType(invalid));
        Assert.Equal("newType", ex.ParamName);
        Assert.Contains("Invalid storage area type.", ex.Message);
    }

    [Fact]
    public void ChangeCapacity_UpdatesCapacity()
    {
        var storageArea = BuildDefaultStorageArea();
        var newCapacity = new StorageCapacity(999);

        storageArea.ChangeCapacity(newCapacity);

        Assert.Equal(newCapacity, storageArea.Capacity);
    }

    [Fact]
    public void ChangeCapacity_WithNull_Throws()
    {
        var storageArea = BuildDefaultStorageArea();
        var ex = Assert.Throws<ArgumentNullException>(() => storageArea.ChangeCapacity(null));
        Assert.Equal("newCapacity", ex.ParamName);
    }

    [Fact]
    public void ToString_FormatsExpected()
    {
        var location = new StorageAreaLocation(5f, 7f);
        var type = StorageAreaType.Warehouse;
        var capacity = new StorageCapacity(100);
        var currentOccupancy = new StorageAreaCurrentOccupancy(50);
        var storageArea = new StorageArea(location, type, capacity, currentOccupancy);

        var expected = $"Id:  | Location: {location} | Type: {type} | Capacity: {capacity} | Current Occupancy: {currentOccupancy}";

        Assert.Equal(expected, storageArea.ToString());
    }

    private static StorageArea BuildDefaultStorageArea()
    {
        return new StorageArea(new StorageAreaLocation(10f, 10f), StorageAreaType.Yard, new StorageCapacity(100));
    }
}