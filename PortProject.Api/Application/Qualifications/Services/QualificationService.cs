using PortProject.Api.Application.Qualifications.DTOs;
using PortProject.Api.Domain.QualificationAggregate;
using PortProject.Api.Models; // Your DbContext namespace

namespace PortProject.Api.Application.Qualifications.Services;

public class QualificationService : IQualificationService
{
    private readonly IQualificationRepository _qualificationRepository;
    private readonly PortProjectContext _context;

    public QualificationService(IQualificationRepository qualificationRepository, PortProjectContext context)
    {
        _qualificationRepository = qualificationRepository;
        _context = context;
    }

    public async Task<QualificationDto> CreateAsync(CreateQualificationDto dto)
    {
        // 1. Create Domain Objects
        var code = new QualificationCode(dto.Code);
        var name = new QualificationName(dto.Name);
        var description = new QualificationDescription(dto.Description);

        // 2. Create Aggregate
        var qualification = new Qualification(code, name, description);

        // 3. Persist
        await _qualificationRepository.AddAsync(qualification);
        await _context.SaveChangesAsync();

        // 4. Map and Return DTO
        return MapToDto(qualification);
    }

    public async Task<IEnumerable<QualificationDto>> GetAllAsync()
    {
        var qualifications = await _qualificationRepository.GetAllAsync();
        return qualifications.Select(MapToDto);
    }

    public async Task<QualificationDto?> GetByCodeAsync(string code)
    {
        var qualificationCode = new QualificationCode(code);
        var qualification = await _qualificationRepository.GetByCodeAsync(qualificationCode);

        return qualification == null ? null : MapToDto(qualification);
    }

    private QualificationDto MapToDto(Qualification qualification)
    {
        return new QualificationDto
        {
            Code = qualification.Code.Value,
            Name = qualification.Name.Value,
            Description = qualification.Description.Value
        };
    }
    
    // --- ADD THIS METHOD ---
    public async Task<QualificationDto?> UpdateAsync(string code, UpdateQualificationDto dto)
    {
        // 1. Find the existing qualification
        var qualificationCode = new QualificationCode(code); // Validate code format
        var qualification = await _qualificationRepository.GetByCodeAsync(qualificationCode);

        if (qualification == null)
        {
            return null; // Or throw KeyNotFoundException
        }

        // 2. Create new Value Objects for the updated data (includes validation)
        var newName = new QualificationName(dto.Name);
        var newDescription = new QualificationDescription(dto.Description);

        // 3. Use the domain entity's methods to update its state
        qualification.UpdateName(newName);
        qualification.UpdateDescription(newDescription);

        // 4. (Optional but good practice) Explicitly tell the repository to update
        await _qualificationRepository.UpdateAsync(qualification);

        // 5. Save changes to the database
        await _context.SaveChangesAsync();

        // 6. Map the updated entity back to a DTO
        return MapToDto(qualification);
    }
}