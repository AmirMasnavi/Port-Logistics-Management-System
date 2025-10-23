using PortProject.Api.Application.StaffMembers.DTOs;
using PortProject.Api.Domain.StaffMemberAggregate;
using PortProject.Api.Models;

namespace PortProject.Api.Application.StaffMembers.Services;

public class StaffMemberService : IStaffMemberService
{
    // In a real app, you would inject a repository to save to the database.
    private readonly IStaffMemberRepository _staffMemberRepository;
    private readonly PortProjectContext _context;
    public StaffMemberService(IStaffMemberRepository staffMemberRepository, PortProjectContext context)
    {
        _staffMemberRepository = staffMemberRepository;
        _context = context;
    }

    public async Task<StaffMemberDto> CreateStaffMemberAsync(CreateStaffMemberDto dto)
    {
        // 1. Map DTO to domain objects. All this logic is now in the service.
        var mecanographicNumber = new MecanographicNumber(dto.MecanographicNumber);
        var contactDetails = new ContactDetails(dto.Email, dto.Phone);
        var operationalWindow = new OperationalWindow(dto.StartTime, dto.EndTime, dto.WorkingDays);

        // 2. Create the aggregate using your domain entity's constructor.
        var newStaffMember = new StaffMember(mecanographicNumber, dto.ShortName, contactDetails, operationalWindow);

        // 3. TODO: Persist the new entity using the repository.
        await _staffMemberRepository.AddAsync(newStaffMember);
        await _context.SaveChangesAsync();

        // 4. Map the resulting entity back to a DTO to return.
        var resultDto = new StaffMemberDto
        {
            MecanographicNumber = newStaffMember.MecanographicNumber.Value,
            ShortName = newStaffMember.ShortName,
            Email = newStaffMember.ContactDetails.Email,
            Phone = newStaffMember.ContactDetails.Phone,
            CurrentStatus = newStaffMember.CurrentStatus.ToString(),
            OperationalWindow = newStaffMember.OperationalWindow.ToString()
        };

        return resultDto;
    }
    
    public async Task<StaffMemberDto?> GetByIdAsync(string id)
    {
        // 1. Convert the string ID to your strongly-typed Value Object
        var mecanographicNumber = new MecanographicNumber(id);

        // 2. Use the repository to find the staff member in the database
        var staffMember = await _staffMemberRepository.GetByIdAsync(mecanographicNumber);

        // 3. If not found, return null
        if (staffMember == null)
        {
            return null;
        }

        // 4. If found, map the entity to a DTO and return it
        return new StaffMemberDto
        {
            MecanographicNumber = staffMember.MecanographicNumber.Value,
            ShortName = staffMember.ShortName,
            Email = staffMember.ContactDetails.Email,
            Phone = staffMember.ContactDetails.Phone,
            CurrentStatus = staffMember.CurrentStatus.ToString(),
            OperationalWindow = staffMember.OperationalWindow.ToString(),
            QualificationCodes = staffMember.Qualifications.Select(q => q.Code.Value).ToList()
        };
    }
    
    public async Task<StaffMemberDto?> UpdateStatusAsync(string id, UpdateStaffStatusDto dto)
    {
        var mecanographicNumber = new MecanographicNumber(id);
        var staffMember = await _staffMemberRepository.GetByIdAsync(mecanographicNumber);

        if (staffMember == null)
        {
            return null; // Not found
        }

        // Use the domain method to update the status
        staffMember.UpdateStatus(dto.NewStatus);

        // Save the changes to the database
        await _context.SaveChangesAsync();

        // Map and return the updated DTO
        return new StaffMemberDto
        {
            MecanographicNumber = staffMember.MecanographicNumber.Value,
            ShortName = staffMember.ShortName,
            Email = staffMember.ContactDetails.Email,
            Phone = staffMember.ContactDetails.Phone,
            CurrentStatus = staffMember.CurrentStatus.ToString(),
            OperationalWindow = staffMember.OperationalWindow.ToString()
        };
    }
    
    public async Task<IEnumerable<StaffMemberDto>> GetAllAsync(string? nameFilter, StaffStatus? statusFilter, string? qualificationCode)
    {
        var staffMembers = await _staffMemberRepository.GetAllAsync(nameFilter, statusFilter, qualificationCode);
        
        // Map the list of entities to a list of DTOs
        return staffMembers.Select(sm => new StaffMemberDto {
            MecanographicNumber = sm.MecanographicNumber.Value,
            ShortName = sm.ShortName,
            Email = sm.ContactDetails.Email,
            Phone = sm.ContactDetails.Phone,
            CurrentStatus = sm.CurrentStatus.ToString(),
            OperationalWindow = sm.OperationalWindow.ToString()
        });
    }
}