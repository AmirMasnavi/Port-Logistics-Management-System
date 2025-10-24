using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using System;

namespace PortProject.Api.Tests.Domain.VesselVisitNotificationAggregate;

[TestClass]
public class ContainerTests
{
    [TestMethod]
    public void Constructor_WithValidData_ShouldCreateInstance()
    {
        // Arrange
        var validCode = new ContainerCode("CSQU3054383"); // Use a valid code
        var position = "Bay 01, Row 01, Tier 01";

        // Act
        var container = new Container(validCode, position);

        // Assert
        Assert.IsNotNull(container);
        Assert.AreEqual(validCode, container.Code);
        Assert.AreEqual(position, container.Position);
    }

    [TestMethod]
    public void Constructor_WithNullContainerCode_ShouldThrowArgumentNullException()
    {
        // Arrange
        ContainerCode nullCode = null;
        var position = "Bay 01, Row 01, Tier 01";

        // Act & Assert
        Assert.ThrowsException<ArgumentNullException>(() => new Container(nullCode, position));
    }

    // Note: Position can likely be null or empty based on current code, add validation if needed.
}