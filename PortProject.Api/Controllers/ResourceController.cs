using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.Resources.DTOs;
using PortProject.Api.Application.Resources.Services;

namespace PortProject.Api.Controllers;


[ApiController]
[Route("api/[controller]")]
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
}