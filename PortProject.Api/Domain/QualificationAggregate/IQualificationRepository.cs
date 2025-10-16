using PortProject.Api.Domain.QualificationAggregate;

namespace PortProject.Api.Domain.QualificationAggregate;

public interface IQualificationRepository
{
    Task AddAsync(Qualification qualification);
    Task<Qualification?> GetByCodeAsync(QualificationCode code);
    Task<IEnumerable<Qualification>> GetAllAsync();
}