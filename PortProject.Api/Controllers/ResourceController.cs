using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.Resources.DTOs;
using PortProject.Api.Application.Resources.Services;
using PortProject.Api.Domain.ResourceAggregate; // added for enums
using Microsoft.AspNetCore.Authorization;

namespace PortProject.Api.Controllers;


[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrator,LogisticsOperator")]
public class ResourceController : ControllerBase
{
    private readonly IResourceService _service;
    
    
    public ResourceController(IResourceService service)
    {
        _service = service;
    }
    
    /// <summary>
    /// Creates a new Resource.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ResourceDto>> CreateResource(CreateResourceDto dto)
    {
        try
        {
            var resultDto = await _service.CreateResourceAsync(dto);
            return CreatedAtAction(nameof(GetResourceByCode), new { code = resultDto.Code }, resultDto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lists resources with optional filters: code (partial), description (partial), kind, status.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ResourceDto>>> SearchResources(
        [FromQuery] string? code,
        [FromQuery] string? description,
        [FromQuery] ResourceKind? kind,
        [FromQuery] ResourceStatus? status)
    {
        var results = await _service.GetAllAsync(code, description, kind, status);
        return Ok(results);
    }

    /// <summary>
    /// Gets a Resource by its Code.
    /// </summary>
    [HttpGet("{code}")]
    public async Task<ActionResult<ResourceDto>> GetResourceByCode(string code)
    {
        var resultDto = await _service.GetByCodeAsync(code);
        if (resultDto == null)
        {
            return NotFound($"Resource with code {code} not found.");
        }

        return Ok(resultDto);
    }


    /// <summary>
    /// Edits a Resource identified by its Code.
    /// </summary>
    [HttpPut("{code}")]
    public async Task<ActionResult<ResourceDto>> EditResource(string code, EditResourceDto dto)
    {
        var resultDto = await _service.EditResourceAsync(code, dto);
        if (resultDto == null)
        {
            return NotFound($"Resource with code {code} not found.");
        }

        return Ok(resultDto);
    }
    
    
    /// <summary>
    /// Updates the status of a Resource.
    /// </summary>
    [HttpPatch("{code}/status")]
    public async Task<ActionResult<ResourceDto>> UpdateResourceStatus(string code, [FromBody] UpdateResourceStatusDto dto)
    {
        var resultDto = await _service.UpdateStatusAsync(code, dto);
        if (resultDto == null)
        {
            return NotFound($"Resource with code {code} not found.");
        }

        return Ok(resultDto);
    }
}