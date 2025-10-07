using PortProject.Api.Application.StaffMembers.DTOs;
using PortProject.Api.Domain.StaffMemberAggregate;

namespace PortProject.Api.Application.StaffMembers.Services;

public class StaffMemberService : IStaffMemberService
{
    // In a real app, you would inject a repository to save to the database.
    // private readonly IStaffMemberRepository _staffMemberRepository;
    // public StaffMemberService(IStaffMemberRepository staffMemberRepository)
    // {
    //     _staffMemberRepository = staffMemberRepository;
    // }

    public async Task<StaffMemberDto> CreateStaffMemberAsync(CreateStaffMemberDto dto)
    {
        // 1. Map DTO to domain objects. All this logic is now in the service.
        var mecanographicNumber = new MecanographicNumber(dto.MecanographicNumber);
        var contactDetails = new ContactDetails(dto.Email, dto.Phone);
        var operationalWindow = new OperationalWindow(dto.StartTime, dto.EndTime, dto.WorkingDays);

        // 2. Create the aggregate using your domain entity's constructor.
        var newStaffMember = new StaffMember(mecanographicNumber, dto.ShortName, contactDetails, operationalWindow);

        // 3. TODO: Persist the new entity using the repository.
        // await _staffMemberRepository.AddAsync(newStaffMember);
        // await _staffMemberRepository.SaveChangesAsync(); // Or similar unit of work pattern

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
}