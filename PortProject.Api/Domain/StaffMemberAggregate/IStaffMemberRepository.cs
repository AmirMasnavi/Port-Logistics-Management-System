namespace PortProject.Api.Domain.StaffMemberAggregate;

public interface IStaffMemberRepository
{
    Task AddAsync(StaffMember staffMember);
    Task<StaffMember?> GetByIdAsync(MecanographicNumber id);
    Task<IEnumerable<StaffMember>> GetAllAsync(string? nameFilter, StaffStatus? statusFilter);
}