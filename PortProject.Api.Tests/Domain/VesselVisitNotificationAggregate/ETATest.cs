using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using System;

namespace PortProject.Api.Tests.Domain.VesselVisitNotificationAggregate;

[TestClass]
public class ETATest
{
    [TestMethod]
    public void CreateETA_WithValidDateTime_ShouldSucceed()
    {
        // Arrange
        var dateTime = DateTime.UtcNow.AddDays(5);

        // Act
        var eta = new ETA(dateTime);

        // Assert
        Assert.IsNotNull(eta);
        Assert.AreEqual(dateTime, eta.Value);
    }

    [TestMethod]
    public void CreateETA_WithPastDateTime_ShouldSucceed()
    {
        // Arrange
        var dateTime = DateTime.UtcNow.AddDays(-5);

        // Act
        var eta = new ETA(dateTime);

        // Assert
        Assert.IsNotNull(eta);
        Assert.AreEqual(dateTime, eta.Value);
    }

    [TestMethod]
    public void ETA_Equality_ShouldWorkCorrectly()
    {
        // Arrange
        var dateTime = DateTime.UtcNow.AddDays(1);
        var eta1 = new ETA(dateTime);
        var eta2 = new ETA(dateTime);

        // Act & Assert
        Assert.AreEqual(eta1, eta2);
    }
}

