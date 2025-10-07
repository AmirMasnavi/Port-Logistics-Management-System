using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.StaffMemberAggregate;

namespace PortProject.Api.Tests.Domain.StaffMemberAggregate
{
    [TestClass]
    public class MecanographicNumberTest
    {
        // Test case: Successful creation with a valid number
        [TestMethod]
        public void CreateMecanographicNumber_WithValidValue_ShouldSucceed()
        {
            // Arrange: Define a valid mecanographic number, including extra whitespace to test trimming.
            var validValue = "  VALID123  ";
            var expectedValue = "VALID123";

            // Act: Create the MecanographicNumber instance.
            var mecanographicNumber = new MecanographicNumber(validValue);

            // Assert: Verify that the value was correctly trimmed, converted to uppercase, and stored.
            Assert.IsNotNull(mecanographicNumber);
            Assert.AreEqual(expectedValue, mecanographicNumber.Value);
        }

        // Test case: Creation with a null, empty, or whitespace value should fail
        [DataTestMethod]
        [DataRow(null)]
        [DataRow("")]
        [DataRow("   ")]
        public void CreateMecanographicNumber_WithNullOrWhitespaceValue_ShouldThrowArgumentException(string invalidValue)
        {
            // Arrange: The invalid value is provided by the test runner.
            // Act & Assert: Verify that creating an instance with an invalid value throws an ArgumentException.
            Assert.ThrowsException<ArgumentException>(() => new MecanographicNumber(invalidValue));
        }

        // Test case: Creation with a value that is too short should fail
        [TestMethod]
        public void CreateMecanographicNumber_WithValueTooShort_ShouldThrowArgumentException()
        {
            // Arrange: Define a value that is shorter than the minimum length requirement.
            var shortValue = "ab";

            // Act & Assert: Verify that the constructor throws an ArgumentException.
            Assert.ThrowsException<ArgumentException>(() => new MecanographicNumber(shortValue));
        }

        // Test case: Creation with a value that is too long should fail
        [TestMethod]
        public void CreateMecanographicNumber_WithValueTooLong_ShouldThrowArgumentException()
        {
            // Arrange: Define a value that is longer than the maximum length requirement.
            var longValue = "this-is-a-very-long-number-12345";

            // Act & Assert: Verify that the constructor throws an ArgumentException.
            Assert.ThrowsException<ArgumentException>(() => new MecanographicNumber(longValue));
        }
    }
}