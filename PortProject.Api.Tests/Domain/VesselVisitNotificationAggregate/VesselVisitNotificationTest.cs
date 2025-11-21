using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Domain.DockAggregate;
using PortProject.Api.Domain.StaffMemberAggregate;
using System;
using System.Collections.Generic;
using System.Linq;

namespace PortProject.Api.Tests.Domain.VesselVisitNotificationAggregate;

[TestClass]
public class VesselVisitNotificationTests
{
    // Helper method to create valid default objects for tests
    private static VesselVisitNotification CreateValidNotification(NotificationStatus initialStatus = NotificationStatus.InProgress)
    {
        var eta = new ETA(DateTime.UtcNow.AddHours(1));
        var etd = new ETD(DateTime.UtcNow.AddHours(10));
        var vesselId = new ImoNumber("9319466"); // Use valid IMO
        var repId = new RepresentativeId(Guid.NewGuid());
        var cargo = new Cargo("Test Cargo", 1000, new List<Container> { new Container(new ContainerCode("CSQU3054383"), "P1") });
        var crew = new List<CrewMember> { new CrewMember("Capt.", "TestNat", false) };

        // Use reflection to create instance and set status if needed (since constructor is private)
        var notification = (VesselVisitNotification)Activator.CreateInstance(typeof(VesselVisitNotification), true)!;

        // Use reflection or a test helper method if needed to set private fields for Arrange phase
        SetPrivateField(notification, "Id", new NotificationId(Guid.NewGuid()));
        SetPrivateField(notification, "BusinessId", "VVN-" + DateTime.UtcNow.Ticks); // Add BusinessId
        SetPrivateField(notification, "EstimatedArrival", eta);
        SetPrivateField(notification, "EstimatedDeparture", etd);
        SetPrivateField(notification, "VesselId", vesselId);
        SetPrivateField(notification, "SubmittedBy", repId);
        SetPrivateField(notification, "Cargo", cargo);
        SetPrivateField(notification, "_crewMembers", crew); // Set the backing field directly
        SetPrivateField(notification, "_decisionLog", new List<DecisionLogEntry>());

        // Set the initial status for the test scenario
        SetPrivateField(notification, "Status", initialStatus);

        return notification;
    }

    // Helper to set private fields via reflection for testing purposes
    private static void SetPrivateField(object obj, string fieldName, object value)
    {
        var field = obj.GetType().GetField(fieldName, System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public);
        if (field == null && fieldName.StartsWith("_")) // Try backing field convention
        {
             field = obj.GetType().GetField($"<{GetPropertyName(fieldName)}>k__BackingField", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public);
        }
         if (field == null) // Try property directly if setter is private/protected
        {
             var prop = obj.GetType().GetProperty(fieldName, System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public);
             prop?.SetValue(obj, value);
             return; // Exit if property was set
        }

        field?.SetValue(obj, value);
    }
     private static string GetPropertyName(string fieldName) => char.ToUpperInvariant(fieldName[1]) + fieldName.Substring(2);


    [TestMethod]
    public void Create_WithValidData_ShouldReturnNotificationInProgress()
    {
        // Arrange
        var eta = new ETA(DateTime.UtcNow.AddHours(1));
        var etd = new ETD(DateTime.UtcNow.AddHours(10));
        var vesselId = new ImoNumber("9319466");
        var repId = new RepresentativeId(Guid.NewGuid());
        var cargo = new Cargo("Test", 100, new List<Container>());
        var crew = new List<CrewMember>();

        // Act
        var notification = VesselVisitNotification.Create(eta, etd, vesselId, repId, cargo, crew);

        // Assert
        Assert.IsNotNull(notification);
        Assert.AreEqual(NotificationStatus.InProgress, notification.Status);
        Assert.IsNotNull(notification.BusinessId); // Verify BusinessId is generated
        Assert.IsTrue(notification.BusinessId.StartsWith("VVN-")); // Verify BusinessId format
        Assert.AreEqual(eta, notification.EstimatedArrival);
        Assert.AreEqual(etd, notification.EstimatedDeparture);
        Assert.AreEqual(vesselId, notification.VesselId);
        Assert.AreEqual(repId, notification.SubmittedBy);
        Assert.AreEqual(cargo, notification.Cargo);
        Assert.IsNotNull(notification.CrewMembers);
        Assert.AreEqual(0, notification.CrewMembers.Count); // Ensure empty list if null passed
        Assert.IsNotNull(notification.DecisionLog);
        Assert.AreEqual(0, notification.DecisionLog.Count);
    }

    [TestMethod]
    public void Create_WithArrivalAfterDeparture_ShouldThrowArgumentException()
    {
        // Arrange
        var eta = new ETA(DateTime.UtcNow.AddHours(10)); // Arrives LATER
        var etd = new ETD(DateTime.UtcNow.AddHours(1)); // Departs EARLIER
        var vesselId = new ImoNumber("9319466");
        var repId = new RepresentativeId(Guid.NewGuid());
        var cargo = new Cargo("Test", 100, new List<Container>());

        // Act & Assert
        Assert.ThrowsException<ArgumentException>(() =>
            VesselVisitNotification.Create(eta, etd, vesselId, repId, cargo, new List<CrewMember>())
        );
    }

    [TestMethod]
    public void Submit_WhenStatusIsInProgress_ShouldChangeStatusToSubmitted()
    {
        // Arrange
        var notification = CreateValidNotification(NotificationStatus.InProgress);

        // Act
        notification.Submit();

        // Assert
        Assert.AreEqual(NotificationStatus.Submitted, notification.Status);
    }

    [TestMethod]
    [DataRow(NotificationStatus.Submitted)]
    [DataRow(NotificationStatus.Approved)]
    [DataRow(NotificationStatus.Rejected)]
    public void Submit_WhenStatusIsNotInProgress_ShouldThrowInvalidOperationException(NotificationStatus status)
    {
        // Arrange
        var notification = CreateValidNotification(status);

        // Act & Assert
        Assert.ThrowsException<InvalidOperationException>(() => notification.Submit());
    }

    [TestMethod]
    public void UpdateDetails_WhenStatusIsInProgress_ShouldUpdatePropertiesAndCrew()
    {
        // Arrange
        var notification = CreateValidNotification(NotificationStatus.InProgress);
        var newEta = new ETA(DateTime.UtcNow.AddHours(2));
        var newEtd = new ETD(DateTime.UtcNow.AddHours(12));
        var newCargo = new Cargo("Updated Cargo", 2000, new List<Container>());
        var newCrew = new List<CrewMember> { new CrewMember("New Guy", "New Nat", false) };

        // Act
        notification.UpdateDetails(newEta, newEtd, newCargo, newCrew);

        // Assert
        Assert.AreEqual(newEta, notification.EstimatedArrival);
        Assert.AreEqual(newEtd, notification.EstimatedDeparture);
        Assert.AreEqual(newCargo, notification.Cargo);
        Assert.AreEqual(1, notification.CrewMembers.Count);
        Assert.AreEqual("New Guy", notification.CrewMembers.First().Name);
    }


    [TestMethod]
    public void Approve_WhenStatusIsSubmitted_ShouldChangeStatusAndLogDecision()
    {
        // Arrange
        var notification = CreateValidNotification(NotificationStatus.Submitted);
        var officerId = new MecanographicNumber("OFFICER1");
        var dockId = new DockId("DOCK-A");

        // Act
        notification.Approve(officerId, dockId);

        // Assert
        Assert.AreEqual(NotificationStatus.Approved, notification.Status);
        Assert.AreEqual(dockId, notification.AssignedDockId);
        Assert.AreEqual(1, notification.DecisionLog.Count);
        var logEntry = notification.DecisionLog.First();
        Assert.AreEqual(DecisionOutcome.Approved, logEntry.Outcome);
        Assert.AreEqual(officerId, logEntry.OfficerId);
        Assert.IsNull(logEntry.Reason);
    }

    [TestMethod]
    [DataRow(NotificationStatus.InProgress)]
    [DataRow(NotificationStatus.Approved)]
    [DataRow(NotificationStatus.Rejected)]
    public void Approve_WhenStatusIsNotSubmitted_ShouldThrowInvalidOperationException(NotificationStatus status)
    {
        // Arrange
        var notification = CreateValidNotification(status);
        var officerId = new MecanographicNumber("OFFICER1");
        var dockId = new DockId("DOCK-A");

        // Act & Assert
        Assert.ThrowsException<InvalidOperationException>(() => notification.Approve(officerId, dockId));
    }

     [TestMethod]
    public void Reject_WhenStatusIsSubmitted_ShouldChangeStatusAndLogDecisionWithReason()
    {
        // Arrange
        var notification = CreateValidNotification(NotificationStatus.Submitted);
        var officerId = new MecanographicNumber("OFFICER2");
        var reason = "Information missing";

        // Act
        notification.Reject(officerId, reason);

        // Assert
        Assert.AreEqual(NotificationStatus.Rejected, notification.Status);
        Assert.IsNull(notification.AssignedDockId); // Dock should not be assigned on rejection
        Assert.AreEqual(1, notification.DecisionLog.Count);
        var logEntry = notification.DecisionLog.First();
        Assert.AreEqual(DecisionOutcome.Rejected, logEntry.Outcome);
        Assert.AreEqual(officerId, logEntry.OfficerId);
        Assert.AreEqual(reason, logEntry.Reason);
    }

    [TestMethod]
    [DataRow(NotificationStatus.InProgress)]
    [DataRow(NotificationStatus.Approved)]
    [DataRow(NotificationStatus.Rejected)]
    public void Reject_WhenStatusIsNotSubmitted_ShouldThrowInvalidOperationException(NotificationStatus status)
    {
        // Arrange
        var notification = CreateValidNotification(status);
        var officerId = new MecanographicNumber("OFFICER2");
        var reason = "Test reason";

        // Act & Assert
        Assert.ThrowsException<InvalidOperationException>(() => notification.Reject(officerId, reason));
    }

    [TestMethod]
    public void Reopen_WhenStatusIsRejected_ShouldChangeStatusToSubmitted()
    {
        // Arrange
        var notification = CreateValidNotification(NotificationStatus.Rejected);

        // Act
        notification.Reopen();

        // Assert
        Assert.AreEqual(NotificationStatus.Submitted, notification.Status);
    }

    [TestMethod]
    [DataRow(NotificationStatus.InProgress)]
    [DataRow(NotificationStatus.Submitted)]
    [DataRow(NotificationStatus.Approved)]
    public void Reopen_WhenStatusIsNotRejected_ShouldThrowInvalidOperationException(NotificationStatus status)
    {
        // Arrange
        var notification = CreateValidNotification(status);

        // Act & Assert
        Assert.ThrowsException<InvalidOperationException>(() => notification.Reopen());
    }

    [TestMethod]
    public void BusinessId_ShouldBeUnique_ForDifferentNotifications()
    {
        // Arrange & Act
        var notification1 = VesselVisitNotification.Create(
            new ETA(DateTime.UtcNow.AddHours(1)),
            new ETD(DateTime.UtcNow.AddHours(10)),
            new ImoNumber("9319466"),
            new RepresentativeId(Guid.NewGuid()),
            new Cargo("Test", 100, new List<Container>()),
            new List<CrewMember>()
        );

        var notification2 = VesselVisitNotification.Create(
            new ETA(DateTime.UtcNow.AddHours(2)),
            new ETD(DateTime.UtcNow.AddHours(12)),
            new ImoNumber("9319466"),
            new RepresentativeId(Guid.NewGuid()),
            new Cargo("Test2", 200, new List<Container>()),
            new List<CrewMember>()
        );

        // Assert
        Assert.IsNotNull(notification1.BusinessId);
        Assert.IsNotNull(notification2.BusinessId);
        Assert.AreNotEqual(notification1.BusinessId, notification2.BusinessId);
    }

    [TestMethod]
    [DataRow(NotificationStatus.Submitted)]
    [DataRow(NotificationStatus.Approved)]
    public void UpdateDetails_WhenStatusIsNotInProgressOrRejected_ShouldThrowInvalidOperationException(NotificationStatus status)
    {
        // Arrange
        var notification = CreateValidNotification(status);
        var newEta = new ETA(DateTime.UtcNow.AddHours(2));
        var newEtd = new ETD(DateTime.UtcNow.AddHours(12));
        var newCargo = new Cargo("Updated", 1500, new List<Container>());
        var newCrew = new List<CrewMember>();

        // Act & Assert
        Assert.ThrowsException<InvalidOperationException>(() => 
            notification.UpdateDetails(newEta, newEtd, newCargo, newCrew));
    }
}