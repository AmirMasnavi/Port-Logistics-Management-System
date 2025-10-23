using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using System;

namespace PortProject.Api.Tests.Domain.VesselVisitNotificationAggregate;

[TestClass]
public class NotificationIdTest
{
    [TestMethod]
    public void CreateNotificationId_WithValidGuid_ShouldSucceed()
    {
        // Arrange
        var guid = Guid.NewGuid();

        // Act
        var notificationId = new NotificationId(guid);

        // Assert
        Assert.IsNotNull(notificationId);
        Assert.AreEqual(guid, notificationId.Value);
    }

    [TestMethod]
    public void NotificationId_Equality_ShouldWorkCorrectly()
    {
        // Arrange
        var guid = Guid.NewGuid();
        var id1 = new NotificationId(guid);
        var id2 = new NotificationId(guid);

        // Act & Assert
        Assert.AreEqual(id1, id2);
    }

    [TestMethod]
    public void NotificationId_DifferentGuids_ShouldNotBeEqual()
    {
        // Arrange
        var id1 = new NotificationId(Guid.NewGuid());
        var id2 = new NotificationId(Guid.NewGuid());

        // Act & Assert
        Assert.AreNotEqual(id1, id2);
    }
}

