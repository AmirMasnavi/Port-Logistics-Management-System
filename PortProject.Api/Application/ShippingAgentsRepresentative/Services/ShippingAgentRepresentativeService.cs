using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Models;

namespace PortProject.Api.Application.ShippingAgentsRepresentative.Services;

public class ShippingAgentRepresentativeService : IShippingAgentRepresentativeService
{
    private readonly IShippingAgentRepresentativeRepository _representativeRepository;
    private readonly PortProjectContext _context;
    public ShippingAgentRepresentativeService(IShippingAgentRepresentativeRepository representativeRepository, PortProjectContext context)
    {
        _representativeRepository = representativeRepository;
        _context = context;
    }

    public async Task<ShippingAgentRepresentative> CreateRepresentativeAsync(CreateShippingAgentRepresentativeDto dto)
    {
        var representative = new ShippingAgentRepresentative(
            new CitizenId(dto.CitizenId),
            new RepresentativeName(dto.RepresentativeName),
            new RepresentativePhone(dto.RepresentativePhone),
            new RepresentativeNationality(dto.RepresentativeNationality),
            new RepresentativeEmail(dto.RepresentativeEmail)
        );

        await _representativeRepository.AddAsync(representative);
        await _context.SaveChangesAsync();

        return representative;
    }

    public async Task<ShippingAgentRepresentativeDto?> GetByIdAsync(string id)
    {
        var repId = new RepresentativeId(Guid.Parse(id));
        var representative = await _representativeRepository.GetByIdAsync(repId);
        if (representative == null) return null;
        return new ShippingAgentRepresentativeDto
        {
            RepresentativeId = representative.RepresentativeId?.Value.ToString() ?? string.Empty,
            RepresentativeName = representative.RepresentativeName?.Value ?? string.Empty,
            CitizenId = representative.CitizenId?.Value ?? string.Empty,
            RepresentativeNationality = representative.RepresentativeNationality?.Value ?? string.Empty,
            RepresentativeEmail = representative.RepresentativeEmail?.Value ?? string.Empty,
            RepresentativePhone = representative.RepresentativePhone?.Value ?? string.Empty
        };
    }

    public async Task<IEnumerable<ShippingAgentRepresentativeDto>> GetAllAsync()
    {
        var reps = await _representativeRepository.GetAllAsync();
        return reps.Select(r => new ShippingAgentRepresentativeDto
        {
            RepresentativeId = r.RepresentativeId?.Value.ToString() ?? string.Empty,
            RepresentativeName = r.RepresentativeName?.Value ?? string.Empty,
            CitizenId = r.CitizenId?.Value ?? string.Empty,
            RepresentativeNationality = r.RepresentativeNationality?.Value ?? string.Empty,
            RepresentativeEmail = r.RepresentativeEmail?.Value ?? string.Empty,
            RepresentativePhone = r.RepresentativePhone?.Value ?? string.Empty
        });
    }

    public async Task<ShippingAgentRepresentativeDto> UpdateRepresentativeAsync(string id, CreateShippingAgentRepresentativeDto dto) 
    {
        var repId = new RepresentativeId(Guid.Parse(id));
        var representative = await _representativeRepository.GetByIdAsync(repId);
        if (representative == null)
            throw new KeyNotFoundException($"Representative with id {id} not found.");

        // Update properties using domain method
        representative.UpdateDetails(
            new CitizenId(dto.CitizenId),
            new RepresentativeName(dto.RepresentativeName),
            new RepresentativePhone(dto.RepresentativePhone),
            new RepresentativeNationality(dto.RepresentativeNationality),
            new RepresentativeEmail(dto.RepresentativeEmail)
        );

        _context.Update(representative);
        await _context.SaveChangesAsync();

        return new ShippingAgentRepresentativeDto
        {
            RepresentativeId = representative.RepresentativeId?.Value.ToString() ?? string.Empty,
            RepresentativeName = representative.RepresentativeName?.Value ?? string.Empty,
            CitizenId = representative.CitizenId?.Value ?? string.Empty,
            RepresentativeNationality = representative.RepresentativeNationality?.Value ?? string.Empty,
            RepresentativeEmail = representative.RepresentativeEmail?.Value ?? string.Empty,
            RepresentativePhone = representative.RepresentativePhone?.Value ?? string.Empty
        };
    }

    public async Task<bool> DeleteRepresentativeAsync(string id)
    {
        var repId = new RepresentativeId(Guid.Parse(id));
        var representative = await _representativeRepository.GetByIdAsync(repId);
        if (representative == null)
            return false;
        _context.Remove(representative);
        await _context.SaveChangesAsync();
        return true;
    }

    // public async Task<IEnumerable<ShippingAgentRepresentativeDto>> GetAllByOrganizationIdAsync(string organizationId)
    // {
    //     // OrganizationId is not present in the model, so this is a placeholder implementation
    //     // If OrganizationId is added to ShippingAgentRepresentative, filter by it here
    //     // For now, return all representatives
    //     var reps = await _representativeRepository.GetAllAsync();
    //     return reps.Select(r => new ShippingAgentRepresentativeDto
    //     {
    //         RepresentativeId = r.RepresentativeId?.Value.ToString() ?? string.Empty,
    //         RepresentativeName = r.RepresentativeName?.Value ?? string.Empty,
    //         CitizenId = r.CitizenId?.Value ?? string.Empty,
    //         RepresentativeNationality = r.RepresentativeNationality?.Value ?? string.Empty,
    //         RepresentativeEmail = r.RepresentativeEmail?.Value ?? string.Empty,
    //         RepresentativePhone = r.RepresentativePhone?.Value ?? string.Empty
    //     });
    // }
}
