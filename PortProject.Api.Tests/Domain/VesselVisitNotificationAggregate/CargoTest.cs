using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using System;
using System.Collections.Generic;
using System.Linq;

namespace PortProject.Api.Tests.Domain.VesselVisitNotificationAggregate;

[TestClass]
public class CargoTests
{
    [TestMethod]
    public void Constructor_WithValidDataAndContainers_ShouldCreateInstance()
    {
        // Arrange
        var description = "Electronics";
        var weight = 5000.0;
        var container1 = new Container(new ContainerCode("CSQU3054383"), "P1");
        var containerList = new List<Container> { container1 };

        // Act
        var cargo = new Cargo(description, weight, containerList);

        // Assert
        Assert.IsNotNull(cargo);
        Assert.AreEqual(description, cargo.Description);
        Assert.AreEqual(weight, cargo.Weight);
        Assert.AreEqual(1, cargo.Containers.Count);
        Assert.IsTrue(cargo.Containers.Contains(container1));
    }

    [TestMethod]
    public void Constructor_WithNullContainerList_ShouldCreateInstanceWithEmptyList()
    {
        // Arrange
        var description = "Empty Load";
        var weight = 0.0;
        List<Container> nullContainerList = null;

        // Act
        var cargo = new Cargo(description, weight, nullContainerList);

        // Assert
        Assert.IsNotNull(cargo);
        Assert.AreEqual(description, cargo.Description);
        Assert.AreEqual(weight, cargo.Weight);
        Assert.IsNotNull(cargo.Containers); // Should initialize to empty list
        Assert.AreEqual(0, cargo.Containers.Count);
    }
}