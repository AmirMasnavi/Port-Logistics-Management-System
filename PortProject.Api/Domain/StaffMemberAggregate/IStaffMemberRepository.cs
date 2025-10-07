namespace PortProject.Api.Domain.StaffMemberAggregate;

public interface IStaffMemberRepository
{
    Task AddAsync(StaffMember staffMember);
    Task<StaffMember?> GetByIdAsync(MecanographicNumber id);
    // You'll add more methods here later, like GetAllAsync and UpdateAsync
}