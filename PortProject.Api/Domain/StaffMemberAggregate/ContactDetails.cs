using System.ComponentModel.DataAnnotations;

namespace PortProject.Api.Domain.StaffMemberAggregate
{
    // Value Object for Contact Details
    public record ContactDetails
    {
        [Required]
        [EmailAddress]
        public string Email { get; }

        [Required]
        [Phone]
        public string Phone { get; }

        public ContactDetails(string email, string phone)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email cannot be null or empty.", nameof(email));
            
            if (string.IsNullOrWhiteSpace(phone))
                throw new ArgumentException("Phone cannot be null or empty.", nameof(phone));

            // Basic email validation (DataAnnotations will handle detailed validation)
            if (!email.Contains('@'))
                throw new ArgumentException("Invalid email format.", nameof(email));

            Email = email.Trim().ToLowerInvariant();
            Phone = phone.Trim();
        }

        public override string ToString() => $"Email: {Email}, Phone: {Phone}";
    }
}
