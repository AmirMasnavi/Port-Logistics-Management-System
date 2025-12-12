using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortProject.Api.Models;

namespace PortProject.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PrivacyPolicyTestController : ControllerBase
    {
        private readonly PortProjectContext _context;

        public PrivacyPolicyTestController(PortProjectContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Test endpoint to verify Privacy Policy tables exist and are accessible
        /// </summary>
        [HttpGet("verify")]
        public async Task<ActionResult> VerifyPrivacyPolicyTables()
        {
            var result = new
            {
                Timestamp = DateTime.UtcNow,
                Tests = new List<object>()
            };

            var tests = new List<object>();

            // Test 1: Database connection
            try
            {
                var canConnect = await _context.Database.CanConnectAsync();
                tests.Add(new { 
                    Test = "Database Connection", 
                    Status = canConnect ? "✓ PASS" : "✗ FAIL",
                    Details = canConnect ? "Connected successfully" : "Cannot connect"
                });
            }
            catch (Exception ex)
            {
                tests.Add(new { Test = "Database Connection", Status = "✗ FAIL", Details = ex.Message });
            }

            // Test 2: PrivacyPolicies table
            try
            {
                var count = await _context.PrivacyPolicies.CountAsync();
                tests.Add(new { 
                    Test = "PrivacyPolicies Table", 
                    Status = "✓ PASS",
                    Details = $"Table exists with {count} records"
                });
            }
            catch (Exception ex)
            {
                tests.Add(new { 
                    Test = "PrivacyPolicies Table", 
                    Status = "✗ FAIL",
                    Details = $"Table does not exist or error: {ex.Message}"
                });
            }

            // Test 3: UserPolicyAcknowledgments table
            try
            {
                var count = await _context.UserPolicyAcknowledgments.CountAsync();
                tests.Add(new { 
                    Test = "UserPolicyAcknowledgments Table", 
                    Status = "✓ PASS",
                    Details = $"Table exists with {count} records"
                });
            }
            catch (Exception ex)
            {
                tests.Add(new { 
                    Test = "UserPolicyAcknowledgments Table", 
                    Status = "✗ FAIL",
                    Details = $"Table does not exist or error: {ex.Message}"
                });
            }

            // Test 4: Applied migrations
            try
            {
                var appliedMigrations = await _context.Database.GetAppliedMigrationsAsync();
                var privacyPolicyMigration = appliedMigrations.FirstOrDefault(m => m.Contains("PrivacyPolicy"));
                
                tests.Add(new { 
                    Test = "Privacy Policy Migration", 
                    Status = privacyPolicyMigration != null ? "✓ PASS" : "⚠ WARNING",
                    Details = privacyPolicyMigration != null 
                        ? $"Migration applied: {privacyPolicyMigration}"
                        : "Privacy Policy migration not found in applied migrations"
                });
            }
            catch (Exception ex)
            {
                tests.Add(new { Test = "Privacy Policy Migration", Status = "✗ FAIL", Details = ex.Message });
            }

            // Test 5: Pending migrations
            try
            {
                var pendingMigrations = await _context.Database.GetPendingMigrationsAsync();
                tests.Add(new { 
                    Test = "Pending Migrations", 
                    Status = pendingMigrations.Any() ? "⚠ WARNING" : "✓ PASS",
                    Details = pendingMigrations.Any() 
                        ? $"{pendingMigrations.Count()} pending: {string.Join(", ", pendingMigrations)}"
                        : "No pending migrations"
                });
            }
            catch (Exception ex)
            {
                tests.Add(new { Test = "Pending Migrations", Status = "✗ FAIL", Details = ex.Message });
            }

            return Ok(new { 
                Timestamp = DateTime.UtcNow,
                Summary = new {
                    TotalTests = tests.Count,
                    Passed = tests.Count(t => t.GetType().GetProperty("Status")?.GetValue(t)?.ToString()?.Contains("✓") == true),
                    Failed = tests.Count(t => t.GetType().GetProperty("Status")?.GetValue(t)?.ToString()?.Contains("✗") == true),
                    Warnings = tests.Count(t => t.GetType().GetProperty("Status")?.GetValue(t)?.ToString()?.Contains("⚠") == true)
                },
                Tests = tests
            });
        }
    }
}

