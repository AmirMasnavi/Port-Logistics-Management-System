using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.PrivacyPolicy.DTOs;
using PortProject.Api.Application.PrivacyPolicy.Services;
using System.Security.Claims;

namespace PortProject.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PrivacyPolicyController : ControllerBase
    {
        private readonly IPrivacyPolicyService _privacyPolicyService;
        private readonly ILogger<PrivacyPolicyController> _logger;

        public PrivacyPolicyController(
            IPrivacyPolicyService privacyPolicyService,
            ILogger<PrivacyPolicyController> logger)
        {
            _privacyPolicyService = privacyPolicyService ?? throw new ArgumentNullException(nameof(privacyPolicyService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Get the current active privacy policy (Public access - no authentication required)
        /// </summary>
        [HttpGet("current")]
        [AllowAnonymous]
        public async Task<ActionResult<PrivacyPolicyDto>> GetCurrentPolicy()
        {
            try
            {
                var policy = await _privacyPolicyService.GetCurrentPolicyAsync();
                if (policy == null)
                {
                    return NotFound(new { message = "No privacy policy is currently published." });
                }

                return Ok(policy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving current privacy policy");
                return StatusCode(500, new { message = "An error occurred while retrieving the privacy policy." });
            }
        }

        /// <summary>
        /// Get all privacy policy history (Admin only)
        /// </summary>
        [HttpGet("history")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<PrivacyPolicyDto>>> GetPolicyHistory()
        {
            try
            {
                var policies = await _privacyPolicyService.GetPolicyHistoryAsync();
                return Ok(policies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving privacy policy history");
                return StatusCode(500, new { message = "An error occurred while retrieving the policy history." });
            }
        }

        /// <summary>
        /// Get a specific privacy policy by ID (Admin only)
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PrivacyPolicyDto>> GetPolicyById(Guid id)
        {
            try
            {
                var policy = await _privacyPolicyService.GetPolicyByIdAsync(id);
                if (policy == null)
                {
                    return NotFound(new { message = $"Privacy policy with ID {id} not found." });
                }

                return Ok(policy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving privacy policy {PolicyId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the privacy policy." });
            }
        }

        /// <summary>
        /// Create and publish a new privacy policy (Admin only)
        /// This will archive the current policy and trigger user notifications
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PrivacyPolicyDto>> CreatePolicy([FromBody] CreatePrivacyPolicyDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated." });
                }

                var policy = await _privacyPolicyService.CreateAndPublishPolicyAsync(dto, userId);
                
                _logger.LogInformation("Privacy policy version {Version} created and published by user {UserId}", 
                    policy.Version, userId);

                return CreatedAtAction(nameof(GetPolicyById), new { id = policy.Id }, policy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating privacy policy");
                return StatusCode(500, new { message = "An error occurred while creating the privacy policy." });
            }
        }

        /// <summary>
        /// Update an existing privacy policy (Admin only)
        /// Note: This updates the content but doesn't change the version
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PrivacyPolicyDto>> UpdatePolicy(Guid id, [FromBody] UpdatePrivacyPolicyDto dto)
        {
            try
            {
                var policy = await _privacyPolicyService.UpdateAndPublishPolicyAsync(id, dto);
                
                _logger.LogInformation("Privacy policy {PolicyId} updated", id);

                return Ok(policy);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating privacy policy {PolicyId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the privacy policy." });
            }
        }

        /// <summary>
        /// Get the current user's privacy policy status
        /// Returns whether the user needs to acknowledge the current policy
        /// </summary>
        [HttpGet("user/status")]
        [Authorize]
        public async Task<ActionResult<UserPolicyStatusDto>> GetUserPolicyStatus()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated." });
                }

                var status = await _privacyPolicyService.GetUserPolicyStatusAsync(userId);
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user policy status");
                return StatusCode(500, new { message = "An error occurred while retrieving the policy status." });
            }
        }

        /// <summary>
        /// Acknowledge the current privacy policy
        /// Records the user's acceptance with timestamp and metadata for GDPR compliance
        /// </summary>
        [HttpPost("acknowledge")]
        [Authorize]
        public async Task<ActionResult> AcknowledgePolicy([FromBody] AcknowledgePrivacyPolicyDto dto)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated." });
                }

                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = Request.Headers["User-Agent"].ToString();

                await _privacyPolicyService.AcknowledgePolicyAsync(userId, dto, ipAddress, userAgent);
                
                _logger.LogInformation("User {UserId} acknowledged privacy policy version {Version}", 
                    userId, dto.PolicyVersion);

                return Ok(new { message = "Privacy policy acknowledged successfully." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error acknowledging privacy policy");
                return StatusCode(500, new { message = "An error occurred while acknowledging the privacy policy." });
            }
        }
    }
}

