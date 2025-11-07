using System;
namespace PortProject.Api.Domain.AppUserAggregate;

public class AppUser
{
    public string Email { get; private set; } // We'll use Email as the ID
    public Role Role { get; private set; }
    public UserStatus Status { get; private set; }
    public string? ActivationToken { get; private set; }
    // We can add FirebaseUserId (string) later

    private AppUser() {} // For EF Core

    public AppUser(string email, Role role)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required.");

        Email = email.ToLowerInvariant();
        Role = role;
        Status = UserStatus.Deactivated; // Default status
        ActivationToken = Guid.NewGuid().ToString(); // Unique token
    }

    public void Activate()
    {
        Status = UserStatus.Activated;
        ActivationToken = null; // Token is used
    }

    public void ChangeRole(Role newRole)
    {
        Role = newRole;
    }
}