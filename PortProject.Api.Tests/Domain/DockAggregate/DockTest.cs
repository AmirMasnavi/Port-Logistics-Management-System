using System;
using System.Collections.Generic;
using PortProject.Api.Domain.DockAggregate;
using src.Domain.VesselTypeAggregate;
using Xunit;

namespace PortProject.Api.Tests.Domain.DockAggregate;

public class DockTest
{
    // ===== Construtor principal =====

    [Fact]
    public void WhenPassingCorrectDataToConstructor_ThenDockIsInstantiated()
    {
        // Arrange
        var id = new DockId("D001");
        var name = new DockName("Main Dock");
        var location = new DockLocation("Zone A", "Section 1");
        var characteristics = new PhysicalCharacteristics(300, 15, 10);
        var cranes = new NumberOfSTSCranes(4);
        var allowedVesselTypes = new List<VesselTypeId> { new VesselTypeId("V001"), new VesselTypeId("V002") };

        // Act
        var dock = new Dock(id, name, location, characteristics, cranes, allowedVesselTypes);

        // Assert
        Assert.NotNull(dock);
        Assert.Equal(id, dock.Id);
        Assert.Equal(name, dock.Name);
        Assert.Equal(location, dock.Location);
        Assert.Equal(characteristics, dock.Characteristics);
        Assert.Equal(cranes, dock.STSCranes);
        Assert.Equal(2, dock.AllowedVesselTypes.Count);
    }

    [Fact]
    public void WhenPassingNullId_ThenThrowsArgumentNullException()
    {
        // Arrange
        DockId id = null;
        var name = new DockName("Dock1");
        var location = new DockLocation("Zone A", "Section 1");
        var characteristics = new PhysicalCharacteristics(300, 15, 10);
        var cranes = new NumberOfSTSCranes(4);
        var allowed = new List<VesselTypeId>();

        // Act & Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            new Dock(id, name, location, characteristics, cranes, allowed)
        );
        Assert.Equal("id", ex.ParamName);
    }

    [Fact]
    public void WhenPassingNullName_ThenThrowsArgumentNullException()
    {
        // Arrange
        var id = new DockId("D002");
        DockName name = null;
        var location = new DockLocation("Zone A", "Section 1");
        var characteristics = new PhysicalCharacteristics(300, 15, 10);
        var cranes = new NumberOfSTSCranes(4);

        // Act & Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            new Dock(id, name, location, characteristics, cranes, new List<VesselTypeId>())
        );
        Assert.Equal("name", ex.ParamName);
    }

    [Fact]
    public void WhenPassingNullLocation_ThenThrowsArgumentNullException()
    {
        // Arrange
        var id = new DockId("D003");
        var name = new DockName("Dock1");
        DockLocation location = null;
        var characteristics = new PhysicalCharacteristics(300, 15, 10);
        var cranes = new NumberOfSTSCranes(4);

        // Act & Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            new Dock(id, name, location, characteristics, cranes, new List<VesselTypeId>())
        );
        Assert.Equal("location", ex.ParamName);
    }

    [Fact]
    public void WhenPassingNullCharacteristics_ThenThrowsArgumentNullException()
    {
        // Arrange
        var id = new DockId("D004");
        var name = new DockName("Dock1");
        var location = new DockLocation("Zone A", "Section 1");
        PhysicalCharacteristics characteristics = null;
        var cranes = new NumberOfSTSCranes(4);

        // Act & Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            new Dock(id, name, location, characteristics, cranes, new List<VesselTypeId>())
        );
        Assert.Equal("characteristics", ex.ParamName);
    }

    [Fact]
    public void WhenPassingNullCranes_ThenThrowsArgumentNullException()
    {
        // Arrange
        var id = new DockId("D005");
        var name = new DockName("Dock1");
        var location = new DockLocation("Zone A", "Section 1");
        var characteristics = new PhysicalCharacteristics(300, 15, 10);
        NumberOfSTSCranes cranes = null;

        // Act & Assert
        var ex = Assert.Throws<ArgumentNullException>(() =>
            new Dock(id, name, location, characteristics, cranes, new List<VesselTypeId>())
        );
        Assert.Equal("cranes", ex.ParamName);
    }

    // ===== Factory method Create =====

    [Fact]
    public void WhenCreatingDockWithValidData_ThenDockIsInstantiated()
    {
        // Arrange
        var allowedIds = new List<string> { "V001", "V002" };

        // Act
        var dock = Dock.Create("D006", "DockX", "ZoneB", "Section3", 400, 20, 12, 5, allowedIds);

        // Assert
        Assert.NotNull(dock);
        Assert.Equal("D006", dock.Id.Value);
        Assert.Equal("DockX", dock.Name.Value);
        Assert.Equal("ZoneB", dock.Location.Zone);
        Assert.Equal("Section3", dock.Location.Section);
        Assert.Equal(400, dock.Characteristics.LengthInMeters);
        Assert.Equal(5, dock.STSCranes.Value);
        Assert.Equal(2, dock.AllowedVesselTypes.Count);
    }

    [Fact]
    public void WhenCreatingDockWithEmptyName_ThenThrowsArgumentException()
    {
        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            Dock.Create("D007", "", "ZoneC", "Section5", 300, 10, 7, 3, new List<string>())
        );
        Assert.Equal("name", ex.ParamName);
    }

    [Fact]
    public void WhenCreatingDockWithNullId_ThenGeneratesNewGuid()
    {
        // Act
        var dock = Dock.Create(null, "AutoDock", "ZoneZ", "Section9", 100, 5, 3, 1, null);

        // Assert
        Assert.NotNull(dock.Id.Value);
        Assert.NotEqual(string.Empty, dock.Id.Value);
    }

    // ===== Métodos Update =====

    [Fact]
    public void WhenUpdatingName_ThenNameIsUpdated()
    {
        // Arrange
        var dock = Dock.Create("D008", "OldName", "ZoneA", "Section1", 300, 15, 10, 4, null);
        var newName = new DockName("NewName");

        // Act
        dock.UpdateName(newName);

        // Assert
        Assert.Equal(newName, dock.Name);
    }

    [Fact]
    public void WhenUpdatingNameWithNull_ThenThrowsArgumentNullException()
    {
        // Arrange
        var dock = Dock.Create("D009", "Dock", "ZoneA", "Section1", 300, 15, 10, 4, null);

        // Act & Assert
        var ex = Assert.Throws<ArgumentNullException>(() => dock.UpdateName(null));
        Assert.Equal("newName", ex.ParamName);
    }

    [Fact]
    public void WhenUpdatingLocation_ThenLocationIsUpdated()
    {
        // Arrange
        var dock = Dock.Create("D010", "Dock", "ZoneA", "Section1", 300, 15, 10, 4, null);
        var newLocation = new DockLocation("ZoneB", "Section2");

        // Act
        dock.UpdateLocation(newLocation);

        // Assert
        Assert.Equal(newLocation, dock.Location);
    }

    [Fact]
    public void WhenUpdatingCharacteristics_ThenCharacteristicsAreUpdated()
    {
        // Arrange
        var dock = Dock.Create("D011", "Dock", "ZoneA", "Section1", 300, 15, 10, 4, null);
        var newCharacteristics = new PhysicalCharacteristics(500, 25, 15);

        // Act
        dock.UpdateCharacteristics(newCharacteristics);

        // Assert
        Assert.Equal(newCharacteristics, dock.Characteristics);
    }

    [Fact]
    public void WhenUpdatingSTSCranes_ThenValueIsUpdated()
    {
        // Arrange
        var dock = Dock.Create("D012", "Dock", "ZoneA", "Section1", 300, 15, 10, 4, null);
        var newCranes = new NumberOfSTSCranes(6);

        // Act
        dock.UpdateSTSCranes(newCranes);

        // Assert
        Assert.Equal(newCranes, dock.STSCranes);
    }

    [Fact]
    public void WhenUpdatingAllowedVesselTypes_ThenListIsReplaced()
    {
        // Arrange
        var dock = Dock.Create("D013", "Dock", "ZoneA", "Section1", 300, 15, 10, 4, new List<string> { "V001" });
        var newTypes = new List<VesselTypeId> { new VesselTypeId("V002"), new VesselTypeId("V003") };

        // Act
        dock.UpdateAllowedVesselTypes(newTypes);

        // Assert
        Assert.Equal(2, dock.AllowedVesselTypes.Count);
        Assert.Contains(dock.AllowedVesselTypes, v => v.Value == "V003");
    }

    // ===== ToString =====

    [Fact]
    public void ToString_ReturnsExpectedFormat()
    {
        // Arrange
        var id = new DockId("D014");
        var name = new DockName("DockY");
        var location = new DockLocation("ZoneC", "Section5");
        var characteristics = new PhysicalCharacteristics(250, 10, 8);
        var cranes = new NumberOfSTSCranes(2);
        var allowed = new List<VesselTypeId> { new VesselTypeId("V001"), new VesselTypeId("V002") };
        var dock = new Dock(id, name, location, characteristics, cranes, allowed);

        var expected = $"ID: {id}, Name: {name}, Location: {location}, Characteristics: {characteristics}, STS Cranes: {cranes}, Allowed Types: [V001, V002]";

        // Act
        var result = dock.ToString();

        // Assert
        Assert.Equal(expected, result);
    }
}