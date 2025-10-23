using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using PortProject.Api.Domain.StaffMemberAggregate;
using System;

namespace PortProject.Api.Tests.Domain.VesselVisitNotificationAggregate
{
    [TestClass]
    public class DecisionLogEntryTest
    {
        [TestMethod]
        public void CreateDecisionLogEntry_WithApprovalOutcome_ShouldSucceed()
        {
            // Arrange
            var timestamp = DateTime.UtcNow;
            var officerId = new MecanographicNumber("OFF123");
            var outcome = DecisionOutcome.Approved;

            // Act
            var logEntry = new DecisionLogEntry(timestamp, officerId, outcome, null);

            // Assert
            Assert.IsNotNull(logEntry);
            Assert.AreEqual(timestamp, logEntry.Timestamp);
            Assert.AreEqual(officerId, logEntry.OfficerId);
            Assert.AreEqual(outcome, logEntry.Outcome);
            Assert.IsNull(logEntry.Reason);
        }

        [TestMethod]
        public void CreateDecisionLogEntry_WithRejectionOutcome_ShouldSucceed()
        {
            // Arrange
            var timestamp = DateTime.UtcNow;
            var officerId = new MecanographicNumber("OFF456");
            var outcome = DecisionOutcome.Rejected;
            var reason = "Dock unavailable";

            // Act
            var logEntry = new DecisionLogEntry(timestamp, officerId, outcome, reason);

            // Assert
            Assert.IsNotNull(logEntry);
            Assert.AreEqual(timestamp, logEntry.Timestamp);
            Assert.AreEqual(officerId, logEntry.OfficerId);
            Assert.AreEqual(outcome, logEntry.Outcome);
            Assert.AreEqual(reason, logEntry.Reason);
        }

        [TestMethod]
        public void CreateDecisionLogEntry_WithNullReason_ShouldSucceed()
        {
            // Arrange
            var timestamp = DateTime.UtcNow;
            var officerId = new MecanographicNumber("OFF789");
            var outcome = DecisionOutcome.Approved;

            // Act
            var logEntry = new DecisionLogEntry(timestamp, officerId, outcome, null);

            // Assert
            Assert.IsNotNull(logEntry);
            Assert.IsNull(logEntry.Reason);
        }
    }
}

