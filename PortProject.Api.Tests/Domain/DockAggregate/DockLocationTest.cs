using Xunit;
using System;
using PortProject.Api.Domain.DockAggregate;

namespace PortProject.Api.Tests.Domain.DockAggregate
{
    public class DockLocationTest
    {
        // ===== Construtor =====

        [Fact]
        public void WhenPassingValidZoneAndSection_ThenDockLocationIsCreated()
        {
            // Act
            var location = new DockLocation("Zone A", "Section 1");

            // Assert
            Assert.NotNull(location);
            Assert.Equal("Zone A", location.Zone);
            Assert.Equal("Section 1", location.Section);
        }

        [Fact]
        public void WhenZoneIsNullOrEmpty_ThenThrowsArgumentException()
        {
            // Arrange
            string zone = "";
            string section = "Section 1";

            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => new DockLocation(zone, section));
            Assert.Equal("zone", ex.ParamName);
        }

        [Fact]
        public void WhenSectionIsNullOrEmpty_ThenThrowsArgumentException()
        {
            // Arrange
            string zone = "Zone A";
            string section = " ";

            // Act & Assert
            var ex = Assert.Throws<ArgumentException>(() => new DockLocation(zone, section));
            Assert.Equal("section", ex.ParamName);
        }

        [Fact]
        public void WhenZoneAndSectionHaveWhitespace_ThenTheyAreTrimmed()
        {
            // Act
            var location = new DockLocation("  Zone X  ", "  Section 9  ");

            // Assert
            Assert.Equal("Zone X", location.Zone);
            Assert.Equal("Section 9", location.Section);
        }

        // ===== Equals =====

        [Fact]
        public void Equals_ReturnsTrue_WhenZoneAndSectionAreTheSame()
        {
            // Arrange
            var loc1 = new DockLocation("Zone A", "Section 1");
            var loc2 = new DockLocation("Zone A", "Section 1");

            // Act
            var result = loc1.Equals(loc2);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public void Equals_ReturnsFalse_WhenZoneOrSectionDiffer()
        {
            // Arrange
            var loc1 = new DockLocation("Zone A", "Section 1");
            var loc2 = new DockLocation("Zone B", "Section 1");
            var loc3 = new DockLocation("Zone A", "Section 2");

            // Act & Assert
            Assert.False(loc1.Equals(loc2));
            Assert.False(loc1.Equals(loc3));
        }

        [Fact]
        public void Equals_ReturnsFalse_WhenObjectIsNullOrDifferentType()
        {
            // Arrange
            var loc = new DockLocation("Zone A", "Section 1");

            // Act & Assert
            Assert.False(loc.Equals(null));
            Assert.False(loc.Equals("InvalidType"));
        }

        // ===== GetHashCode =====

        [Fact]
        public void GetHashCode_IsConsistentForEqualObjects()
        {
            // Arrange
            var loc1 = new DockLocation("Zone A", "Section 1");
            var loc2 = new DockLocation("Zone A", "Section 1");

            // Act
            var hash1 = loc1.GetHashCode();
            var hash2 = loc2.GetHashCode();

            // Assert
            Assert.Equal(hash1, hash2);
        }

        [Fact]
        public void GetHashCode_DiffersForDifferentLocations()
        {
            // Arrange
            var loc1 = new DockLocation("Zone A", "Section 1");
            var loc2 = new DockLocation("Zone B", "Section 2");

            // Act
            var hash1 = loc1.GetHashCode();
            var hash2 = loc2.GetHashCode();

            // Assert
            Assert.NotEqual(hash1, hash2);
        }

        // ===== ToString =====

        [Fact]
        public void ToString_ReturnsExpectedFormat()
        {
            // Arrange
            var location = new DockLocation("Zone X", "Section 5");
            var expected = "Zone: Zone X, Section: Section 5";

            // Act
            var result = location.ToString();

            // Assert
            Assert.Equal(expected, result);
        }
    }
}
