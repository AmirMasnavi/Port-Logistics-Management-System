using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using PortProject.Api.Models;
using PortProject.Api.Domain.AppUserAggregate;

namespace PortProject.Api.Application.UserAdmin.Services
{
    public class ClaimsTransformationService : IClaimsTransformation
    {
        // We can't inject DbContext directly here usually because of scope issues, 
        // so we inject the ScopeFactory to get a fresh DbContext for each request.
        private readonly IServiceProvider _serviceProvider;

        public ClaimsTransformationService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            // 1. Check if we already processed this user (to avoid infinite loops)
            // OR if the user isn't logged in.
            if (principal.Identity == null || !principal.Identity.IsAuthenticated || principal.HasClaim(c => c.Type == ClaimTypes.Role))
            {
                return principal;
            }

            // 2. Get the user's email from the Firebase Token
            // Firebase usually puts the email in a claim named "email" or "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
            var email = principal.FindFirstValue(ClaimTypes.Email) ?? principal.FindFirstValue("email");

            Console.WriteLine($"[ClaimsTransformation] Email from token: '{email}'");

            if (string.IsNullOrEmpty(email))
            {
                Console.WriteLine("[ClaimsTransformation] No email found in token");
                return principal;
            }

            // 3. Create a scope to get the Database Context
            using (var scope = _serviceProvider.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<PortProjectContext>();

                // 4. Find the user in YOUR database
                // IMPORTANT: Use ToLowerInvariant() to match how emails are stored in AppUser constructor
                var normalizedEmail = email.ToLowerInvariant();
                Console.WriteLine($"[ClaimsTransformation] Looking up user with normalized email: '{normalizedEmail}'");
                
                var appUser = await context.AppUsers.FindAsync(normalizedEmail);

                if (appUser == null)
                {
                    Console.WriteLine($"[ClaimsTransformation] User NOT FOUND in database for email: '{normalizedEmail}'");
                    return principal;
                }

                Console.WriteLine($"[ClaimsTransformation] User found: Email='{appUser.Email}', Role='{appUser.Role}', Status='{appUser.Status}'");

                // 5. If user exists and is ACTIVE, add the Role claim
                if (appUser.Status == UserStatus.Activated)
                {
                    // Create a new Identity based on the old one
                    var cloneIdentity = ((ClaimsIdentity)principal.Identity).Clone();
                    
                    // Add the Role Claim
                    // This matches [Authorize(Roles = "Administrator")]
                    cloneIdentity.AddClaim(new Claim(ClaimTypes.Role, appUser.Role.ToString()));

                    Console.WriteLine($"[ClaimsTransformation] ✅ Role claim added: '{appUser.Role}'");
                    return new ClaimsPrincipal(cloneIdentity);
                }
                else
                {
                    Console.WriteLine($"[ClaimsTransformation] ❌ User is NOT activated. Status: '{appUser.Status}'");
                }
            }

            // If user not found in DB, they have no roles, return original principal
            return principal;
        }
    }
}