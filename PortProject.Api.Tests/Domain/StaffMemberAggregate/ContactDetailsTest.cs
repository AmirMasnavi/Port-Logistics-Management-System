using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using PortProject.Api.Domain.StaffMemberAggregate;

namespace PortProject.Api.Tests.Domain.StaffMemberAggregate
{
    [TestClass]
    public class ContactDetailsTest
    {
        // Test case: Successful creation with valid email and phone
        [TestMethod]
        public void CreateContactDetails_WithValidInputs_ShouldSucceed()
        {
            // Arrange: Define a valid email and phone, with extra whitespace and mixed case to test normalization.
            var email = "  Test@Example.COM  ";
            var phone = "  123-456-7890  ";
            var expectedEmail = "test@example.com";
            var expectedPhone = "123-456-7890";

            // Act: Create the ContactDetails instance.
            var contactDetails = new ContactDetails(email, phone);

            // Assert: Verify that the properties are correctly trimmed, normalized, and stored.
            Assert.IsNotNull(contactDetails);
            Assert.AreEqual(expectedEmail, contactDetails.Email);
            Assert.AreEqual(expectedPhone, contactDetails.Phone);
        }

        // Test case: Creation with a null or empty email should fail
        [DataTestMethod]
        [DataRow(null)]
        [DataRow("")]
        [DataRow("   ")]
        public void CreateContactDetails_WithInvalidEmail_ShouldThrowArgumentException(string invalidEmail)
        {
            // Arrange: The invalid email is provided by the test runner. A valid phone is used.
            var validPhone = "1234567890";

            // Act & Assert: Verify that an ArgumentException is thrown.
            Assert.ThrowsException<ArgumentException>(() => new ContactDetails(invalidEmail, validPhone));
        }
        
        // Test case: Creation with a malformed email should fail
        [TestMethod]
        public void CreateContactDetails_WithMalformedEmail_ShouldThrowArgumentException()
        {
            // Arrange: Define an email without an '@' symbol.
            var malformedEmail = "test.example.com";
            var validPhone = "1234567890";

            // Act & Assert: Verify that an ArgumentException is thrown.
            Assert.ThrowsException<ArgumentException>(() => new ContactDetails(malformedEmail, validPhone));
        }

        // Test case: Creation with a null or empty phone should fail
        [DataTestMethod]
        [DataRow(null)]
        [DataRow("")]
        [DataRow("   ")]
        public void CreateContactDetails_WithInvalidPhone_ShouldThrowArgumentException(string invalidPhone)
        {
            // Arrange: A valid email is used. The invalid phone is provided by the test runner.
            var validEmail = "test@example.com";

            // Act & Assert: Verify that an ArgumentException is thrown.
            Assert.ThrowsException<ArgumentException>(() => new ContactDetails(validEmail, invalidPhone));
        }
    }
}