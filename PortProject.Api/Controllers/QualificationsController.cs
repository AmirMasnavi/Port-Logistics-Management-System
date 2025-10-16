using Microsoft.AspNetCore.Mvc;
using PortProject.Api.Application.Qualifications;
using PortProject.Api.Application.Qualifications.DTOs;

namespace PortProject.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QualificationsController : ControllerBase
{
    private readonly IQualificationService _qualificationService;

    public QualificationsController(IQualificationService qualificationService)
    {
        _qualificationService = qualificationService;
    }

    [HttpPost]
    public async Task<ActionResult<QualificationDto>> CreateQualification(CreateQualificationDto dto)
    {
        try
        {
            var resultDto = await _qualificationService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetQualificationByCode), new { code = resultDto.Code }, resultDto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<QualificationDto>>> GetAllQualifications()
    {
        var qualifications = await _qualificationService.GetAllAsync();
        return Ok(qualifications);
    }

    [HttpGet("{code}")]
    public async Task<ActionResult<QualificationDto>> GetQualificationByCode(string code)
    {
        var qualification = await _qualificationService.GetByCodeAsync(code);
        if (qualification == null)
        {
            return NotFound();
        }
        return Ok(qualification);
    }
}