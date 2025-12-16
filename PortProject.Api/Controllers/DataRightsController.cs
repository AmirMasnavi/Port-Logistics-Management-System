using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.DataRights.DTOs;
using PortProject.Api.Application.DataRights.Services;
using System.Security.Claims;
using System.Text.Json;

namespace PortProject.Api.Controllers;

[ApiController]
[Route("api/data-rights")]
[Authorize]
public class DataRightsController : ControllerBase
{
    private readonly IDataRightsService _dataRightsService;
    private readonly ILogger<DataRightsController> _logger;

    public DataRightsController(
        IDataRightsService dataRightsService,
        ILogger<DataRightsController> logger)
    {
        _dataRightsService = dataRightsService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new data rights request (access, rectification, or deletion)
    /// </summary>
    [HttpPost("requests")]
    public async Task<IActionResult> CreateRequest([FromBody] CreateDataRightsRequestDto dto)
    {
        try
        {
            var email = GetUserEmail();
            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized(new { message = "User email not found in token" });
            }

            var request = await _dataRightsService.CreateRequestAsync(email, dto);

            _logger.LogInformation("Data rights request created: {RequestId} for user {Email}", 
                request.Id, email);

            return Ok(new
            {
                message = "Your data rights request has been submitted and logged. You will be notified once it's processed.",
                request
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating data rights request");
            return StatusCode(500, new { message = "An error occurred while processing your request" });
        }
    }

    /// <summary>
    /// Get the current user's personal data in JSON format
    /// </summary>
    [HttpGet("my-data")]
    public async Task<IActionResult> GetMyPersonalData()
    {
        try
        {
            var email = GetUserEmail();
            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized(new { message = "User email not found in token" });
            }

            var userData = await _dataRightsService.GetUserPersonalDataAsync(email);
            return Ok(userData);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving personal data");
            return StatusCode(500, new { message = "An error occurred while retrieving your data" });
        }
    }

    /// <summary>
    /// Download the current user's personal data as JSON file
    /// </summary>
    [HttpGet("my-data/download/json")]
    public async Task<IActionResult> DownloadPersonalDataJson()
    {
        try
        {
            var email = GetUserEmail();
            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized(new { message = "User email not found in token" });
            }

            var userData = await _dataRightsService.GetUserPersonalDataAsync(email);
            var json = JsonSerializer.Serialize(userData, new JsonSerializerOptions 
            { 
                WriteIndented = true 
            });
            var bytes = System.Text.Encoding.UTF8.GetBytes(json);

            var fileName = $"personal_data_{email.Replace("@", "_at_")}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";

            return File(bytes, "application/json", fileName);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading personal data as JSON");
            return StatusCode(500, new { message = "An error occurred while downloading your data" });
        }
    }

    /// <summary>
    /// Download the current user's personal data as PDF file
    /// </summary>
    [HttpGet("my-data/download/pdf")]
    public async Task<IActionResult> DownloadPersonalDataPdf()
    {
        try
        {
            var email = GetUserEmail();
            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized(new { message = "User email not found in token" });
            }

            var pdfBytes = await _dataRightsService.GeneratePersonalDataPdfAsync(email);
            var fileName = $"personal_data_{email.Replace("@", "_at_")}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.pdf";

            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading personal data as PDF");
            return StatusCode(500, new { message = "An error occurred while downloading your data" });
        }
    }

    /// <summary>
    /// Get all data rights requests for the current user
    /// </summary>
    [HttpGet("my-requests")]
    public async Task<IActionResult> GetMyRequests()
    {
        try
        {
            var email = GetUserEmail();
            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized(new { message = "User email not found in token" });
            }

            var requests = await _dataRightsService.GetUserRequestsAsync(email);
            return Ok(requests);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user requests");
            return StatusCode(500, new { message = "An error occurred while retrieving your requests" });
        }
    }

    private string? GetUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");
    }
}

