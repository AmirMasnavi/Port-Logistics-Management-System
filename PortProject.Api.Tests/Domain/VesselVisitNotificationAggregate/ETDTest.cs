using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using System;

namespace PortProject.Api.Tests.Domain.VesselVisitNotificationAggregate;

[TestClass]
public class ETDTest
{
    [TestMethod]
    public void CreateETD_WithValidDateTime_ShouldSucceed()
    {
        // Arrange
        var dateTime = DateTime.UtcNow.AddDays(7);

        // Act
        var etd = new ETD(dateTime);

        // Assert
        Assert.IsNotNull(etd);
        Assert.AreEqual(dateTime, etd.Value);
    }

    [TestMethod]
    public void CreateETD_WithPastDateTime_ShouldSucceed()
    {
        // Arrange
        var dateTime = DateTime.UtcNow.AddDays(-3);

        // Act
        var etd = new ETD(dateTime);

        // Assert
        Assert.IsNotNull(etd);
        Assert.AreEqual(dateTime, etd.Value);
    }

    [TestMethod]
    public void ETD_Equality_ShouldWorkCorrectly()
    {
        // Arrange
        var dateTime = DateTime.UtcNow.AddDays(10);
        var etd1 = new ETD(dateTime);
        var etd2 = new ETD(dateTime);

        // Act & Assert
        Assert.AreEqual(etd1, etd2);
    }
}

