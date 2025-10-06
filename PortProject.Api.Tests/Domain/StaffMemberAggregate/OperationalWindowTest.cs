using System;
using System.Linq;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.StaffMemberAggregate;

namespace PortProject.Api.Tests.Domain.StaffMemberAggregate
{
    [TestClass]
    public class OperationalWindowTest
    {
        // Test case: Successful creation with valid times and custom working days
        [TestMethod]
        public void CreateOperationalWindow_WithValidTimes_ShouldSucceed()
        {
            // Arrange: Define valid start and end times.
            var startTime = new TimeOnly(9, 0); // 09:00
            var endTime = new TimeOnly(17, 0); // 17:00
            var workingDays = new[] { DayOfWeek.Monday, DayOfWeek.Wednesday };

            // Act: Create the OperationalWindow instance.
            var window = new OperationalWindow(startTime, endTime, workingDays);

            // Assert: Verify the properties were set correctly.
            Assert.AreEqual(startTime, window.StartTime);
            Assert.AreEqual(endTime, window.EndTime);
            Assert.AreEqual(2, window.WorkingDays.Count);
            Assert.IsTrue(window.WorkingDays.Contains(DayOfWeek.Monday));
        }

        // Test case: Creation with start time after or equal to end time should fail
        [TestMethod]
        public void CreateOperationalWindow_WithStartTimeAfterEndTime_ShouldThrowArgumentException()
        {
            // Arrange: Define an invalid time range.
            var startTime = new TimeOnly(17, 0);
            var endTime = new TimeOnly(9, 0);

            // Act & Assert: Verify that an ArgumentException is thrown.
            Assert.ThrowsException<ArgumentException>(() => new OperationalWindow(startTime, endTime));
        }

        // Test case: Creation with null working days should default to Monday-Friday
        [TestMethod]
        public void CreateOperationalWindow_WithNullWorkingDays_ShouldDefaultToWeekdays()
        {
            // Arrange: Define valid times but null for working days.
            var startTime = new TimeOnly(9, 0);
            var endTime = new TimeOnly(17, 0);

            // Act: Create the instance without specifying working days.
            var window = new OperationalWindow(startTime, endTime, null);

            // Assert: Verify that the WorkingDays property defaulted to 5 weekdays.
            Assert.AreEqual(5, window.WorkingDays.Count);
            Assert.IsTrue(window.WorkingDays.Contains(DayOfWeek.Monday));
            Assert.IsFalse(window.WorkingDays.Contains(DayOfWeek.Saturday));
        }

        // Test case: Check if a datetime is within the operational window
        [TestMethod]
        public void IsWithinWindow_WhenDateTimeIsInside_ShouldReturnTrue()
        {
            // Arrange: Create a window for Wednesdays from 9 to 5.
            var window = new OperationalWindow(new TimeOnly(9, 0), new TimeOnly(17, 0), new[] { DayOfWeek.Wednesday });
            // This is a Wednesday at 11:30 AM
            var dateTimeInside = new DateTime(2025, 10, 8, 11, 30, 0);

            // Act: Check the availability.
            var result = window.IsWithinWindow(dateTimeInside);

            // Assert: The result should be true.
            Assert.IsTrue(result);
        }

        // Test case: Check if a datetime on the right day but wrong time is outside the window
        [TestMethod]
        public void IsWithinWindow_WhenTimeIsOutside_ShouldReturnFalse()
        {
            // Arrange: Create a window for Wednesdays from 9 to 5.
            var window = new OperationalWindow(new TimeOnly(9, 0), new TimeOnly(17, 0), new[] { DayOfWeek.Wednesday });
            // This is a Wednesday at 8:00 AM (too early)
            var dateTimeOutside = new DateTime(2025, 10, 8, 8, 0, 0);

            // Act: Check the availability.
            var result = window.IsWithinWindow(dateTimeOutside);

            // Assert: The result should be false.
            Assert.IsFalse(result);
        }

        // Test case: Check if a datetime at the right time but wrong day is outside the window
        [TestMethod]
        public void IsWithinWindow_WhenDayIsOutside_ShouldReturnFalse()
        {
            // Arrange: Create a window for Wednesdays from 9 to 5.
            var window = new OperationalWindow(new TimeOnly(9, 0), new TimeOnly(17, 0), new[] { DayOfWeek.Wednesday });
            // This is a Tuesday at 11:30 AM (wrong day)
            var dateTimeOutside = new DateTime(2025, 10, 7, 11, 30, 0);
            
            // Act: Check the availability.
            var result = window.IsWithinWindow(dateTimeOutside);

            // Assert: The result should be false.
            Assert.IsFalse(result);
        }
    }
}