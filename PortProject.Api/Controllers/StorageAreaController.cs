using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.StorageAreas.DTOs;
using PortProject.Api.Application.StorageAreas.Services;

namespace PortProject.Api.Controllers;


[ApiController]
[Route("api/[controller]")]
public class StorageAreaController : ControllerBase
{
    private readonly IStorageAreaService _storageAreaService;

    public StorageAreaController(IStorageAreaService storageAreaService)
    {
        _storageAreaService = storageAreaService;
    }

    /// <summary>
    /// Creates a new Storage Area.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<StorageAreaDto>> CreateStorageArea(CreateStorageAreaDto dto)
    {
        try
        {
            var resultDto = await _storageAreaService.CreateStorageAreaAsync(dto);
            
            // Return 201 with the created storage area, without exposing DB ID in the body
            // and without including it in the Location header either.
            return Created(string.Empty, resultDto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Gets a Storage Area by its code.
    /// </summary>
    [HttpGet("{code}")]
    public async Task<ActionResult<StorageAreaDto>> GetStorageAreaById(string code)
    {
        var resultDto = await _storageAreaService.GetByIdAsync(code);

        if (resultDto == null)
        {
            return NotFound($"Storage area with code {code} not found.");
        }

        return Ok(resultDto);
    }


    /// <summary>
    /// Updates an existing Storage Area.
    /// </summary>
    [HttpPut("{code}")]
    public async Task<ActionResult<StorageAreaDto>> UpdateStorageArea(string code, UpdateStorageAreaDto dto)
    {
        var resultDto = await _storageAreaService.UpdateStorageAreaAsync(code, dto);
        if (resultDto == null)
        {
            return NotFound($"Storage area with code {code} not found.");
        }

        return Ok(resultDto);
    }
    
    /// <summary>
    /// Gets all Storage Areas.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<StorageAreaDto>>> GetAllStorageAreas()
    {
        var result = await _storageAreaService.GetAllAsync();
        return Ok(result);
    }
}