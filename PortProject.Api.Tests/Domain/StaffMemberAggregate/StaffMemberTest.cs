using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.Qualification;
using PortProject.Api.Domain.StaffMemberAggregate;

namespace PortProject.Api.Tests.Domain.StaffMemberAggregate
{
    [TestClass]
    public class StaffMemberTest
    {
        // Helper properties for reusable test data
        private readonly MecanographicNumber _validMecNumber = new("EMP123");
        private readonly ContactDetails _validContact = new("test@example.com", "555-1234");
        private readonly OperationalWindow _validWindow = new(new TimeOnly(9, 0), new TimeOnly(17, 0));
        private readonly string _validShortName = "John Doe";

        // Test case: Successful creation with all valid parameters
        [TestMethod]
        public void CreateStaffMember_WithValidParameters_ShouldSucceed()
        {
            // Arrange: All parameters are valid.
            // Act: Create the StaffMember instance.
            var staffMember = new StaffMember(_validMecNumber, _validShortName, _validContact, _validWindow);

            // Assert: Verify all properties were set correctly, and default status is 'Available'.
            Assert.IsNotNull(staffMember);
            Assert.AreEqual(_validMecNumber, staffMember.MecanographicNumber);
            Assert.AreEqual(_validShortName, staffMember.ShortName);
            Assert.AreEqual(StaffStatus.Available, staffMember.CurrentStatus);
            Assert.AreEqual(0, staffMember.Qualifications.Count); // No initial qualifications
        }

        // Test case: Creation with a null mecanographic number should fail
        [TestMethod]
        public void CreateStaffMember_WithNullMecanographicNumber_ShouldThrowArgumentNullException()
        {
            // Arrange: Set mecanographic number to null.
            // Act & Assert: Verify the constructor throws ArgumentNullException.
            Assert.ThrowsException<ArgumentNullException>(() => 
                new StaffMember(null!, _validShortName, _validContact, _validWindow));
        }

        // Test case: Creation with an empty or whitespace short name should fail
        [DataTestMethod]
        [DataRow("")]
        [DataRow("   ")]
        public void CreateStaffMember_WithInvalidShortName_ShouldThrowArgumentException(string invalidName)
        {
            // Arrange: The invalid name is provided by the test runner.
            // Act & Assert: Verify the constructor throws ArgumentException.
            Assert.ThrowsException<ArgumentException>(() => 
                new StaffMember(_validMecNumber, invalidName, _validContact, _validWindow));
        }

        // Test case: Adding a new, unique qualification
        // [TestMethod]
        // public void AddQualification_WhenNotPresent_ShouldAddToList()
        // {
        //     // Arrange: Create a staff member and a new qualification ID.
        //     var staffMember = new StaffMember(_validMecNumber, _validShortName, _validContact, _validWindow);
        //     var qualificationId = new QualificationId(Guid.NewGuid());
        //
        //     // Act: Add the qualification.
        //     staffMember.AddQualification(qualificationId);
        //
        //     // Assert: The qualification count should be 1 and the new ID should be in the list.
        //     Assert.AreEqual(1, staffMember.Qualifications.Count);
        //     Assert.IsTrue(staffMember.Qualifications.Contains(qualificationId));
        // }

        // Test case: Adding a qualification that already exists should not create a duplicate
        // [TestMethod]
        // public void AddQualification_WhenAlreadyPresent_ShouldNotAddDuplicate()
        // {
        //     // Arrange: Create a staff member with an initial qualification.
        //     var qualificationId = new QualificationId(Guid.NewGuid());
        //     var staffMember = new StaffMember(_validMecNumber, _validShortName, _validContact, _validWindow, 
        //         new() { qualificationId });
        //
        //     // Act: Try to add the same qualification again.
        //     staffMember.AddQualification(qualificationId);
        //
        //     // Assert: The qualification count should remain 1.
        //     Assert.AreEqual(1, staffMember.Qualifications.Count);
        // }




        // Test case: Removing a qualification that exists
        // [TestMethod]
        // public void RemoveQualification_WhenPresent_ShouldRemoveFromList()
        // {
        //     // Arrange: Create a staff member with an initial qualification.
        //     var qualificationId = new QualificationId(Guid.NewGuid());
        //     var staffMember = new StaffMember(_validMecNumber, _validShortName, _validContact, _validWindow, 
        //         new() { qualificationId });
        //
        //     // Act: Remove the qualification.
        //     staffMember.RemoveQualification(qualificationId);
        //
        //     // Assert: The qualification count should be 0.
        //     Assert.AreEqual(0, staffMember.Qualifications.Count);
        // }

        // Test case: Updating the staff member's status
        [TestMethod]
        public void UpdateStatus_ToUnavailable_ShouldChangeStatus()
        {
            // Arrange: Create a staff member. Default status is Available.
            var staffMember = new StaffMember(_validMecNumber, _validShortName, _validContact, _validWindow);

            // Act: Update the status to Unavailable.
            staffMember.UpdateStatus(StaffStatus.Unavailable);

            // Assert: The status should now be Unavailable.
            Assert.AreEqual(StaffStatus.Unavailable, staffMember.CurrentStatus);
        }

        // Test case: IsAvailableAt should return false when status is Unavailable
        [TestMethod]
        public void IsAvailableAt_WhenStatusIsUnavailable_ShouldReturnFalse()
        {
            // Arrange: Create a staff member and set their status to Unavailable.
            var staffMember = new StaffMember(_validMecNumber, _validShortName, _validContact, _validWindow);
            staffMember.UpdateStatus(StaffStatus.Unavailable);
            var dateTime = new DateTime(2025, 10, 8, 10, 0, 0); // Wednesday at 10:00

            // Act: Check availability.
            var isAvailable = staffMember.IsAvailableAt(dateTime);

            // Assert: The result should be false, regardless of the time.
            Assert.IsFalse(isAvailable);
        }

        // Test case: IsAvailableAt should return true when status is Available and datetime is within the window
        [TestMethod]
        public void IsAvailableAt_WhenStatusIsAvailableAndInWindow_ShouldReturnTrue()
        {
            // Arrange: Create an available staff member.
            var staffMember = new StaffMember(_validMecNumber, _validShortName, _validContact, _validWindow);
            var dateTime = new DateTime(2025, 10, 8, 10, 0, 0); // Wednesday at 10:00

            // Act: Check availability.
            var isAvailable = staffMember.IsAvailableAt(dateTime);

            // Assert: The result should be true.
            Assert.IsTrue(isAvailable);
        }
    }
}