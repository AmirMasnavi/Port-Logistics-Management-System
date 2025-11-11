using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Models;

using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using src.Domain.Shared;
using PortProject.Api.Application.ShippingAgentsRepresentative.Services;

namespace PortProject.Api.Application.ShippingAgentsOrganization.Services
{
    public sealed class ShippingAgentOrganizationService : IShippingAgentOrganizationService
    {
        private readonly IShippingAgentOrganizationRepository _repository;
        private readonly PortProjectContext _context;
        private readonly IShippingAgentRepresentativeService _repService;

        public ShippingAgentOrganizationService(IShippingAgentOrganizationRepository repository, PortProjectContext context, IShippingAgentRepresentativeService repService)
        {
            _repository = repository;
            _context = context;
            _repService = repService;
        }

        public async Task<ShippingAgentRepresentativeDto> AddRepresentativeToOrganizationAsync(string organizationId, CreateShippingAgentRepresentativeDto dto)
        {
            if (string.IsNullOrWhiteSpace(organizationId))
                throw new ArgumentException("OrganizationId is required.");
            
            if (!Guid.TryParse(organizationId, out var guidValue))
                throw new ArgumentException($"Invalid OrganizationId format. Expected a valid GUID but received: '{organizationId}'");
            
            var orgId = new OrganizationId(guidValue);
            var org = await _repository.GetByIdAsync(orgId);
            if (org == null)
                throw new KeyNotFoundException($"Organization with ID {organizationId} not found.");

            var representative = await _repService.CreateRepresentativeAsync(dto);
           // org.AddRepresentative(representative);
            _context.Update(org);
            await _context.SaveChangesAsync();
            return new ShippingAgentRepresentativeDto
            {
                RepresentativeId = representative.RepresentativeId?.Value.ToString() ?? string.Empty,
                OrganizationId = representative.OrganizationId?.Value.ToString() ?? string.Empty,
                RepresentativeName = representative.RepresentativeName?.Value ?? string.Empty,
                CitizenId = representative.CitizenId?.Value ?? string.Empty,
                RepresentativeNationality = representative.RepresentativeNationality?.Value ?? string.Empty,
                RepresentativeEmail = representative.RepresentativeEmail?.Value ?? string.Empty,
                RepresentativePhone = representative.RepresentativePhone?.Value ?? string.Empty
            };
        }

    public async Task<Guid> RegisterOrganizationAsync(CreateShippingAgentOrganizationDto dto, CancellationToken ct = default)
        {
            if (dto.Representatives == null || dto.Representatives.Count == 0)
                throw new InvalidOperationException("At least one representative must be provided.");

            var legalName = new LegalName(dto.LegalName);
            var tax = new TaxNumber(dto.TaxNumber);

            if (await _repository.ExistsByLegalNameAsync(legalName))
                throw new InvalidOperationException($"An organization with legal name '{dto.LegalName}' already exists.");

            if (await _repository.ExistsByTaxNumberAsync(tax))
                throw new InvalidOperationException($"An organization with tax number '{dto.TaxNumber}' already exists.");

            var org = new ShippingAgentOrganization(
                OrganizationId.NewId(),
                legalName,
                new AlternativeName(dto.AlternativeName),
                new Address(dto.Street, dto.City, dto.Country),
                tax
            );

            foreach (var rep in dto.Representatives)
            {
                // Create representative directly without OrganizationName
                var representative = new ShippingAgentRepresentative(
                    new CitizenId(rep.CitizenId),
                    new RepresentativeName(rep.RepresentativeName),
                    new RepresentativePhone(rep.RepresentativePhone),
                    new RepresentativeNationality(rep.RepresentativeNationality),
                    new RepresentativeEmail(rep.RepresentativeEmail)
                );
                
                // Set the organizationId for the representative
                representative.AttachToOrganization(org.Id!);
                await _context.ShippingAgentRepresentatives.AddAsync(representative);
            }

            await _repository.AddAsync(org);
            await _context.SaveChangesAsync(ct);
            return org.Id?.Value ?? Guid.Empty;
        }

        public async Task<ShippingAgentOrganizationDto?> GetByIdAsync(Guid id, CancellationToken ct = default)
        {
            var org = await _repository.GetByIdAsync(new OrganizationId(id));
            if (org == null) return null;
            return MapToDto(org);
        }

        public async Task<IEnumerable<ShippingAgentOrganizationDto>> GetAllAsync(CancellationToken ct = default)
        {
            var orgs = await _repository.GetAllAsync(ct);
            return orgs.Select(MapToDto);
        }

        private ShippingAgentOrganizationDto MapToDto(ShippingAgentOrganization org)
        {
            return new ShippingAgentOrganizationDto
            {
                LegalName = org.LegalName?.Value ?? string.Empty,
                AlternativeName = org.AlternativeName?.Value ?? string.Empty,
                Street = org.Address?.Street ?? string.Empty,
                City = org.Address?.City ?? string.Empty,
                Country = org.Address?.Country ?? string.Empty,
                TaxNumber = org.TaxNumber?.Value ?? string.Empty
            };
        }
    }
}