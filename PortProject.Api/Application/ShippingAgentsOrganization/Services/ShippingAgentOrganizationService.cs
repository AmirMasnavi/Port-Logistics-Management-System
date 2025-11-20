using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Models;

using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
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
            var street = dto.Street?.Trim();
            var city = dto.City?.Trim();
            var country = dto.Country?.Trim();
            var address = new Address(street, city, country);

            var normalizedEmail = dto.Email?.Trim().ToLowerInvariant();
            dto.Email = normalizedEmail ?? string.Empty;

            if (await _repository.ExistsByEmailAsync(dto.Email))
                throw new InvalidOperationException($"An organization with email '{dto.Email}' already exists.");
            if (await _repository.ExistsByPhoneAsync(dto.Phone))
                throw new InvalidOperationException($"An organization with phone '{dto.Phone}' already exists.");
            if (await _repository.ExistsByAddressAsync(address))
                throw new InvalidOperationException($"An organization with the same address already exists.");

            // Validate representatives uniqueness (CitizenId & Email not present in reps or org emails)
            var existingOrgEmails = (await _repository.GetAllAsync()).Select(o => o.Email).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var existingRepEmails = (await _repService.GetAllAsync()).Select(r => r.RepresentativeEmail).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var existingRepCitizenIds = (await _repService.GetAllAsync()).Select(r => r.CitizenId).ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var rep in dto.Representatives)
            {
                if (existingRepCitizenIds.Contains(rep.CitizenId))
                    throw new InvalidOperationException($"A representative with citizen ID '{rep.CitizenId}' already exists.");
                if (existingRepEmails.Contains(rep.RepresentativeEmail) || existingOrgEmails.Contains(rep.RepresentativeEmail))
                    throw new InvalidOperationException($"Email '{rep.RepresentativeEmail}' already exists in another representative or organization.");
            }

            var org = new ShippingAgentOrganization(
                OrganizationId.NewId(),
                legalName,
                new AlternativeName(dto.AlternativeName),
                address,
                tax,
                dto.Email,
                dto.Phone
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
                Email = org.Email ?? string.Empty,
                Phone = org.Phone ?? string.Empty,
                TaxNumber = org.TaxNumber?.Value ?? string.Empty
            };
        }
    }
}