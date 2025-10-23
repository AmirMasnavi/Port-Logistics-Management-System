using PortProject.Api.Domain.DockAggregate;
using src.Domain.VesselTypeAggregate;
using Xunit;

namespace PortProject.Api.Integration_Tests
{
    public class DockTest
    {
        [Fact]
        public void WhenPassingCorrectData_ThenDockIsCreated()
        {
            // Arrange
            var allowedTypes = new List<VesselTypeId> { new VesselTypeId("1001"), new VesselTypeId("1002") };
            var characteristics = new PhysicalCharacteristics(300, 15, 12);
            var cranes = new NumberOfSTSCranes(5);

            // Act
            var dock = new Dock(
                new DockId("dock-1"),
                new DockName("Dock A"),
                new DockLocation("Zone 1", "Section A"),
                characteristics,
                cranes,
                allowedTypes
            );

            // Assert
            Assert.NotNull(dock);
            Assert.Equal("dock-1", dock.Id.Value);
            Assert.Equal("Dock A", dock.Name.Value);
            Assert.Equal("Zone 1", dock.Location.Zone);
            Assert.Equal("Section A", dock.Location.Section);
            Assert.Equal(characteristics, dock.Characteristics);
            Assert.Equal(cranes, dock.STSCranes);
            Assert.Equal(2, dock.AllowedVesselTypes.Count);
        }

        [Fact]
        public void Create_FactoryMethod_AssignsValuesCorrectly()
        {
            // Act
            var dock = Dock.Create(
                id: null,
                name: "Dock B",
                locationZone: "Zone 2",
                locationSection: "Section B",
                lengthInMeters: 250,
                depthInMeters: 14,
                maxDraftInMeters: 11,
                numberOfSTSCranes: 4,
                allowedVesselTypeIds: new List<string> { "1003", "1004" }
            );

            // Assert
            Assert.NotNull(dock);
            Assert.Equal("Dock B", dock.Name.Value);
            Assert.Equal("Zone 2", dock.Location.Zone);
            Assert.Equal("Section B", dock.Location.Section);
            Assert.Equal(250, dock.Characteristics.LengthInMeters);
            Assert.Equal(14, dock.Characteristics.DepthInMeters);
            Assert.Equal(11, dock.Characteristics.MaxDraftInMeters);
            Assert.Equal(4, dock.STSCranes.Value);
            Assert.Equal(2, dock.AllowedVesselTypes.Count);
        }

        [Fact]
        public void Create_WithEmptyName_ThrowsArgumentException()
        {
            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() =>
                Dock.Create(
                    id: null,
                    name: "",
                    locationZone: "Zone",
                    locationSection: "Section",
                    lengthInMeters: 200,
                    depthInMeters: 10,
                    maxDraftInMeters: 8,
                    numberOfSTSCranes: 3,
                    allowedVesselTypeIds: null
                )
            );

            Assert.Equal("name", ex.ParamName, ignoreCase: true);
        }

        [Fact]
        public void UpdateName_UpdatesSuccessfully()
        {
            // Arrange
            var dock = Dock.Create(
                id: null,
                name: "Old Dock",
                locationZone: "Zone",
                locationSection: "Section",
                lengthInMeters: 200,
                depthInMeters: 10,
                maxDraftInMeters: 8,
                numberOfSTSCranes: 3,
                allowedVesselTypeIds: null
            );

            var newName = new DockName("New Dock");

            // Act
            dock.UpdateName(newName);

            // Assert
            Assert.Equal("New Dock", dock.Name.Value);
        }

        [Fact]
        public void UpdateLocation_UpdatesSuccessfully()
        {
            // Arrange
            var dock = Dock.Create(
                id: null,
                name: "Dock",
                locationZone: "Zone1",
                locationSection: "Section1",
                lengthInMeters: 200,
                depthInMeters: 10,
                maxDraftInMeters: 8,
                numberOfSTSCranes: 3,
                allowedVesselTypeIds: null
            );

            var newLocation = new DockLocation("Zone2", "Section2");

            // Act
            dock.UpdateLocation(newLocation);

            // Assert
            Assert.Equal("Zone2", dock.Location.Zone);
            Assert.Equal("Section2", dock.Location.Section);
        }

        [Fact]
        public void UpdateCharacteristics_UpdatesSuccessfully()
        {
            // Arrange
            var dock = Dock.Create(
                id: null,
                name: "Dock",
                locationZone: "Zone",
                locationSection: "Section",
                lengthInMeters: 200,
                depthInMeters: 10,
                maxDraftInMeters: 8,
                numberOfSTSCranes: 3,
                allowedVesselTypeIds: null
            );

            var newCharacteristics = new PhysicalCharacteristics(250, 12, 9);

            // Act
            dock.UpdateCharacteristics(newCharacteristics);

            // Assert
            Assert.Equal(250, dock.Characteristics.LengthInMeters);
            Assert.Equal(12, dock.Characteristics.DepthInMeters);
            Assert.Equal(9, dock.Characteristics.MaxDraftInMeters);
        }

        [Fact]
        public void UpdateSTSCranes_UpdatesSuccessfully()
        {
            // Arrange
            var dock = Dock.Create(
                id: null,
                name: "Dock",
                locationZone: "Zone",
                locationSection: "Section",
                lengthInMeters: 200,
                depthInMeters: 10,
                maxDraftInMeters: 8,
                numberOfSTSCranes: 3,
                allowedVesselTypeIds: null
            );

            var newCranes = new NumberOfSTSCranes(6);

            // Act
            dock.UpdateSTSCranes(newCranes);

            // Assert
            Assert.Equal(6, dock.STSCranes.Value);
        }

        [Fact]
        public void UpdateAllowedVesselTypes_UpdatesSuccessfully()
        {
            // Arrange
            var dock = Dock.Create(
                id: null,
                name: "Dock",
                locationZone: "Zone",
                locationSection: "Section",
                lengthInMeters: 200,
                depthInMeters: 10,
                maxDraftInMeters: 8,
                numberOfSTSCranes: 3,
                allowedVesselTypeIds: new List<string> { "1001" }
            );

            var newTypes = new List<VesselTypeId> { new VesselTypeId("1002"), new VesselTypeId("1003") };

            // Act
            dock.UpdateAllowedVesselTypes(newTypes);

            // Assert
            Assert.Equal(2, dock.AllowedVesselTypes.Count);
            Assert.Contains(dock.AllowedVesselTypes, t => t.Value == "1002");
            Assert.Contains(dock.AllowedVesselTypes, t => t.Value == "1003");
        }

        [Fact]
        public void ToString_ReturnsFormattedString()
        {
            // Arrange
            var dock = Dock.Create(
                id: "dock-123",
                name: "DockX",
                locationZone: "ZoneX",
                locationSection: "SectionX",
                lengthInMeters: 300,
                depthInMeters: 15,
                maxDraftInMeters: 12,
                numberOfSTSCranes: 4,
                allowedVesselTypeIds: new List<string> { "1001", "1002" }
            );

            // Act
            var str = dock.ToString();

            // Assert
            Assert.Contains("dock-123", str);
            Assert.Contains("DockX", str);
            Assert.Contains("ZoneX", str);
            Assert.Contains("SectionX", str);
            Assert.Contains("300", str);
            Assert.Contains("15", str);
            Assert.Contains("12", str);
            Assert.Contains("4", str);
            Assert.Contains("1001", str);
            Assert.Contains("1002", str);
        }
    }
}
