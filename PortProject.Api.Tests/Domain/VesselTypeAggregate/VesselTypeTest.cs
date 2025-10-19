using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.VesselTypeAggregate;

namespace PortProject.Api.Tests.Domain.VesselTypeAggregate;

using src.Domain.VesselTypeAggregate;
using src.Domain.Shared;
using Xunit;
using System;
using Moq;

// Testes para a classe VesselType (Agregado)
public class VesselTypeTest
{
    // Testes para o construtor principal de VesselType
    [Fact]
    public void WhenPassingCorrectDataToConstructor_ThenVesselTypeIsInstantiated()
    {
        // Arrange
        var id = new VesselTypeId("1001");
        var name = new VesselTypeName("CargoShip");
        var description = new VesselTypeDescription("Container Vessel");
        var capacity = new VesselTypeCapacity(100);
        var dimensions = new VesselTypeDimensions(10, 5, 8);

        // Act & Assert
        var vesselType = new VesselType(id, name, description, capacity, dimensions);

        Assert.NotNull(vesselType);
        Assert.Equal(id, vesselType.Id);
        Assert.Equal(name, vesselType.Name);
        Assert.Equal(description, vesselType.Description);
        Assert.Equal(capacity, vesselType.Capacity);
        Assert.Equal(dimensions, vesselType.OperationalConstraints);
    }

    [Fact]
    public void WhenPassingNullIdToConstructor_ThenThrowsArgumentNullException()
    {
        // Arrange
        VesselTypeId id = null;
        var name = new VesselTypeName("CargoShip");
        var description = new VesselTypeDescription("Container Vessel");
        var capacity = new VesselTypeCapacity(100);
        var dimensions = new VesselTypeDimensions(10, 5, 8);

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            // Act
            new VesselType(id, name, description, capacity, dimensions)
        );
        Assert.Equal("id", ex.ParamName);
    }

    [Fact]
    public void WhenPassingNullName_ThenThrowsArgumentNullException()
    {
        // Arrange
        var id = new VesselTypeId("1002");
        VesselTypeName name = null;
        var description = new VesselTypeDescription("Container Vessel");
        var capacity = new VesselTypeCapacity(100);
        var dimensions = new VesselTypeDimensions(10, 5, 8);

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            // Act
            new VesselType(id, name, description, capacity, dimensions)
        );
        Assert.Equal("name", ex.ParamName);
    }

    [Fact]
    public void WhenPassingNullDescription_ThenThrowsArgumentNullException()
    {
        // Arrange
        var id = new VesselTypeId("1003");
        var name = new VesselTypeName("CargoShip");
        VesselTypeDescription description = null;
        var capacity = new VesselTypeCapacity(100);
        var dimensions = new VesselTypeDimensions(10, 5, 8);

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            // Act
            new VesselType(id, name, description, capacity, dimensions)
        );
        Assert.Equal("description", ex.ParamName);
    }

    [Fact]
    public void WhenPassingNullCapacity_ThenThrowsArgumentNullException()
    {
        // Arrange
        var id = new VesselTypeId("1004");
        var name = new VesselTypeName("CargoShip");
        var description = new VesselTypeDescription("Container Vessel");
        VesselTypeCapacity capacity = null;
        var dimensions = new VesselTypeDimensions(10, 5, 8);

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            // Act
            new VesselType(id, name, description, capacity, dimensions)
        );
        Assert.Equal("capacity", ex.ParamName);
    }

    [Fact]
    public void WhenPassingNullOperationalConstraints_ThenThrowsArgumentNullException()
    {
        // Arrange
        var id = new VesselTypeId("1005");
        var name = new VesselTypeName("CargoShip");
        var description = new VesselTypeDescription("Container Vessel");
        var capacity = new VesselTypeCapacity(100);
        VesselTypeDimensions dimensions = null;

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            // Act
            new VesselType(id, name, description, capacity, dimensions)
        );
        Assert.Equal("operationalConstraints", ex.ParamName);
    }

    // Testes para o método Factory Create
    [Theory]
    [InlineData("1", "Tanker", "Petroleum Carrier", 5000, 20, 10, 15)]
    [InlineData("2", "ContainerVessel", "Standard Container Ship", 2000, 15, 8, 12)]
    public void WhenCreatingVesselTypeWithCorrectData_ThenVesselTypeIsInstantiated(string id, string name, string description, int capacity, int rows, int bays, int tiers)
    {
        // Act
        var vesselType = VesselType.Create(id, name, description, capacity, rows, bays, tiers);

        // Assert
        Assert.NotNull(vesselType);
        Assert.Equal(id, vesselType.Id.Value);
        Assert.Equal(name, vesselType.Name.Value);
        Assert.Equal(description, vesselType.Description.Value);
        Assert.Equal(capacity, vesselType.Capacity.Value);
        Assert.Equal(rows, vesselType.OperationalConstraints.MaxRows);
        Assert.Equal(bays, vesselType.OperationalConstraints.MaxBays);
        Assert.Equal(tiers, vesselType.OperationalConstraints.MaxTiers);
    }


    // Testes para os métodos Update
    [Fact]
    public void WhenUpdatingName_ThenNameIsUpdated()
    {
        // Arrange
        var id = new VesselTypeId("1006");
        var originalName = new VesselTypeName("OldName");
        var description = new VesselTypeDescription("Desc");
        var capacity = new VesselTypeCapacity(100);
        var dimensions = new VesselTypeDimensions(10, 5, 8);
        var vesselType = new VesselType(id, originalName, description, capacity, dimensions);

        var newName = new VesselTypeName("NewName");

        // Act
        vesselType.UpdateName(newName);

        // Assert
        Assert.Equal(newName, vesselType.Name);
    }

    [Fact]
    public void WhenUpdatingNameWithNull_ThenThrowsArgumentNullException()
    {
        // Arrange
        var vesselType = VesselType.Create("1007", "Name", "Desc", 100, 10, 5, 8);
        VesselTypeName newName = null;

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            // Act
            vesselType.UpdateName(newName)
        );
        Assert.Equal("newName", ex.ParamName);
    }

    [Fact]
    public void WhenUpdatingDescription_ThenDescriptionIsUpdated()
    {
        // Arrange
        var id = new VesselTypeId("1008");
        var name = new VesselTypeName("Name");
        var originalDescription = new VesselTypeDescription("OldDesc");
        var capacity = new VesselTypeCapacity(100);
        var dimensions = new VesselTypeDimensions(10, 5, 8);
        var vesselType = new VesselType(id, name, originalDescription, capacity, dimensions);

        var newDescription = new VesselTypeDescription("NewDesc");

        // Act
        vesselType.UpdateDescription(newDescription);

        // Assert
        Assert.Equal(newDescription, vesselType.Description);
    }

    [Fact]
    public void WhenUpdatingDescriptionWithNull_ThenThrowsArgumentNullException()
    {
        // Arrange
        var vesselType = VesselType.Create("1009", "Name", "Desc", 100, 10, 5, 8);
        VesselTypeDescription newDescription = null;

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            // Act
            vesselType.UpdateDescription(newDescription)
        );
        Assert.Equal("newDescription", ex.ParamName);
    }

    [Fact]
    public void WhenUpdatingCapacity_ThenCapacityIsUpdated()
    {
        // Arrange
        var id = new VesselTypeId("1010");
        var name = new VesselTypeName("Name");
        var description = new VesselTypeDescription("Desc");
        var originalCapacity = new VesselTypeCapacity(100);
        var dimensions = new VesselTypeDimensions(10, 5, 8);
        var vesselType = new VesselType(id, name, description, originalCapacity, dimensions);

        var newCapacity = new VesselTypeCapacity(200);

        // Act
        vesselType.UpdateCapacity(newCapacity);

        // Assert
        Assert.Equal(newCapacity, vesselType.Capacity);
    }

    [Fact]
    public void WhenUpdatingCapacityWithNull_ThenThrowsArgumentNullException()
    {
        // Arrange
        var vesselType = VesselType.Create("1011", "Name", "Desc", 100, 10, 5, 8);
        VesselTypeCapacity newCapacity = null;

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            // Act
            vesselType.UpdateCapacity(newCapacity)
        );
        Assert.Equal("newCapacity", ex.ParamName);
    }

    [Fact]
    public void WhenUpdatingOperationalConstraints_ThenOperationalConstraintsAreUpdated()
    {
        // Arrange
        var id = new VesselTypeId("1012");
        var name = new VesselTypeName("Name");
        var description = new VesselTypeDescription("Desc");
        var capacity = new VesselTypeCapacity(100);
        var originalDimensions = new VesselTypeDimensions(10, 5, 8);
        var vesselType = new VesselType(id, name, description, capacity, originalDimensions);

        var newDimensions = new VesselTypeDimensions(20, 10, 15);

        // Act
        vesselType.UpdateOperationalConstraints(newDimensions);

        // Assert
        Assert.Equal(newDimensions, vesselType.OperationalConstraints);
    }

    [Fact]
    public void WhenUpdatingOperationalConstraintsWithNull_ThenThrowsArgumentNullException()
    {
        // Arrange
        var vesselType = VesselType.Create("1013", "Name", "Desc", 100, 10, 5, 8);
        VesselTypeDimensions newConstraints = null;

        // Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            // Act
            vesselType.UpdateOperationalConstraints(newConstraints)
        );
        Assert.Equal("newConstraints", ex.ParamName);
    }

    // Teste para ToString
    [Fact]
    public void ToString_ReturnsExpectedFormat()
    {
        // Arrange
        var id = new VesselTypeId("123");
        var name = new VesselTypeName("TestVessel");
        var description = new VesselTypeDescription("Test Description");
        var capacity = new VesselTypeCapacity(500);
        var dimensions = new VesselTypeDimensions(5, 3, 2);
        var vesselType = new VesselType(id, name, description, capacity, dimensions);
        var expected = $"ID: {id}, Name: {name}, Description: {description}, Capacity: {capacity}, Constraints: {dimensions}";

        // Act
        var result = vesselType.ToString();

        // Assert
        Assert.Equal(expected, result);
    }
}