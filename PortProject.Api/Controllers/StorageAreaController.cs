using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.StorageAreas.DTOs;
using PortProject.Api.Application.StorageAreas.Services;
using PortProject.Api.Domain.StorageAggregate;

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
            
            return CreatedAtAction(nameof(GetStorageAreaById), new { id = int.Parse(resultDto.Id) }, resultDto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Gets a Storage Area by its ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<StorageAreaDto>> GetStorageAreaById(int id)
    {
        var resultDto = await _storageAreaService.GetByIdAsync(id);

        if (resultDto == null)
        {
            return NotFound($"Storage area with ID {id} not found.");
        }

        return Ok(resultDto);
    }


    /// <summary>
    /// Updates an existing Storage Area.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<StorageAreaDto>> UpdateStorageArea(int id, UpdateStorageAreaDto dto)
    {
        var resultDto = await _storageAreaService.UpdateStorageAreaAsync(id, dto);
        if (resultDto == null)
        {
            return NotFound($"Storage area with ID {id} not found.");
        }

        return Ok(resultDto);
    }
}