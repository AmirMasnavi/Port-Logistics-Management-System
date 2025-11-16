using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PortProject.Api.Application.ShippingAgentsOrganization.DTOs;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Models;

namespace PortProject.Api.Application.ShippingAgentsRepresentative.Services
{
    public class ShippingAgentRepresentativeService : IShippingAgentRepresentativeService
    {
        private readonly IShippingAgentRepresentativeRepository _representativeRepository;
        private readonly IShippingAgentOrganizationRepository _organizationRepository;
        private readonly PortProjectContext _context;

        public ShippingAgentRepresentativeService(
            IShippingAgentRepresentativeRepository representativeRepository, 
            IShippingAgentOrganizationRepository organizationRepository,
            PortProjectContext context)
        {
            _representativeRepository = representativeRepository;
            _organizationRepository = organizationRepository;
            _context = context;
        }


        public async Task<ShippingAgentRepresentative> CreateRepresentativeAsync(CreateShippingAgentRepresentativeDto dto)
        {
            var citizenId = new CitizenId(dto.CitizenId);
            
            // Check if a representative with this citizen ID already exists
            if (await _representativeRepository.ExistsByCitizenIdAsync(citizenId))
                throw new InvalidOperationException($"A representative with citizen ID '{dto.CitizenId}' already exists.");
            
            var representative = new ShippingAgentRepresentative(
                citizenId,
                new RepresentativeName(dto.RepresentativeName),
                new RepresentativePhone(dto.RepresentativePhone),
                new RepresentativeNationality(dto.RepresentativeNationality),
                new RepresentativeEmail(dto.RepresentativeEmail)
            );
            
            // If OrganizationName is provided, look up the organization by name and attach
            if (!string.IsNullOrWhiteSpace(dto.OrganizationName))
            {
                var org = await _organizationRepository.GetByLegalNameAsync(new LegalName(dto.OrganizationName));
                if (org == null)
                    throw new KeyNotFoundException($"Organization with name '{dto.OrganizationName}' not found.");
                representative.AttachToOrganization(org.Id!);
            }
            else
            {
                throw new ArgumentException("OrganizationName is required to create a representative.");
            }
            
            await _representativeRepository.AddAsync(representative);
            await _context.SaveChangesAsync();
            return representative;
        }

        public async Task<ShippingAgentRepresentativeDto?> GetByCitizenIdAsync(string id)
        {
            var repId = new RepresentativeId(Guid.Parse(id));
            var representative = await _representativeRepository.GetByIdAsync(repId);
            if (representative == null) return null;
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

        public async Task<IEnumerable<ShippingAgentRepresentativeDto>> GetAllAsync()
        {
            var reps = await _representativeRepository.GetAllAsync();
            return reps.Select(r => new ShippingAgentRepresentativeDto
            {
                RepresentativeId = r.RepresentativeId != null ? r.RepresentativeId.Value.ToString() : string.Empty,
                OrganizationId = r.OrganizationId != null ? r.OrganizationId.Value.ToString() : string.Empty,
                RepresentativeName = r.RepresentativeName?.Value ?? string.Empty,
                CitizenId = r.CitizenId?.Value ?? string.Empty,
                RepresentativeNationality = r.RepresentativeNationality?.Value ?? string.Empty,
                RepresentativeEmail = r.RepresentativeEmail?.Value ?? string.Empty,
                RepresentativePhone = r.RepresentativePhone?.Value ?? string.Empty
            });
        }

        public async Task<ShippingAgentRepresentativeDto?> UpdateRepresentativeAsync(string id, CreateShippingAgentRepresentativeDto dto)
        {
            var repId = new RepresentativeId(Guid.Parse(id));
            var representative = await _representativeRepository.GetByIdAsync(repId);
            if (representative == null)
                return null;

            representative.UpdateDetails(
                new CitizenId(dto.CitizenId),
                new RepresentativeName(dto.RepresentativeName),
                new RepresentativePhone(dto.RepresentativePhone),
                new RepresentativeNationality(dto.RepresentativeNationality),
                new RepresentativeEmail(dto.RepresentativeEmail)
            );
            
            await _representativeRepository.UpdateAsync(representative);
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

        public async Task<ShippingAgentRepresentativeDto?> UpdateRepresentativeByCitizenIdAsync(string citizenId, CreateShippingAgentRepresentativeDto dto)
        {
            var citizen = new CitizenId(citizenId);
            var representative = await _representativeRepository.GetByCitizenIdAsync(citizen);
            if (representative == null)
                return null;

            // Prevent changing the citizen ID
            if (!dto.CitizenId.Equals(citizenId, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Cannot change the Citizen ID of an existing representative.");

            // Update scalar details
            representative.UpdateDetails(
                new CitizenId(dto.CitizenId),
                new RepresentativeName(dto.RepresentativeName),
                new RepresentativePhone(dto.RepresentativePhone),
                new RepresentativeNationality(dto.RepresentativeNationality),
                new RepresentativeEmail(dto.RepresentativeEmail)
            );

            // If an OrganizationName was supplied, try to attach the representative to that organization
            if (!string.IsNullOrWhiteSpace(dto.OrganizationName))
            {
                var org = await _organizationRepository.GetByLegalNameAsync(new LegalName(dto.OrganizationName));
                if (org == null)
                    throw new KeyNotFoundException($"Organization with name '{dto.OrganizationName}' not found.");
                representative.AttachToOrganization(org.Id!);
            }
             
            await _representativeRepository.UpdateAsync(representative);
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

        public async Task<bool> DeleteRepresentativeAsync(string id)
        {
            // Accept either a GUID representative id or a citizenId string.
            // If `id` is a GUID, delete by RepresentativeId as before. If not, try to delete by CitizenId.
            if (Guid.TryParse(id, out var guid))
            {
                var repId = new RepresentativeId(guid);
                var representative = await _representativeRepository.GetByIdAsync(repId);
                if (representative == null)
                    return false;

                await _representativeRepository.DeleteAsync(representative);
                return true;
            }

            // Fallback: treat `id` as a citizenId value
            try
            {
                var citizen = new CitizenId(id);
                var representative = await _representativeRepository.GetByCitizenIdAsync(citizen);
                if (representative == null)
                    return false;

                await _representativeRepository.DeleteAsync(representative);
                return true;
            }
            catch
            {
                // If constructing CitizenId throws or any other error occurs, simply return false
                return false;
            }
        }

        public async Task<bool> DeleteRepresentativeByCitizenIdAsync(string citizenId)
        {
            var citizen = new CitizenId(citizenId);
            var representative = await _representativeRepository.GetByCitizenIdAsync(citizen);
            if (representative == null)
                return false;
            
            await _representativeRepository.DeleteAsync(representative);
            return true;
        }

        public async Task<IEnumerable<ShippingAgentRepresentativeDto>> GetByOrganizationIdAsync(string organizationId)
        {
            var orgId = new OrganizationId(Guid.Parse(organizationId));
            var reps = await _representativeRepository.GetByOrganizationIdAsync(orgId);
            return reps.Select(r => new ShippingAgentRepresentativeDto
            {
                RepresentativeId = r.RepresentativeId != null ? r.RepresentativeId.Value.ToString() : string.Empty,
                OrganizationId = r.OrganizationId != null ? r.OrganizationId.Value.ToString() : string.Empty,
                RepresentativeName = r.RepresentativeName?.Value ?? string.Empty,
                CitizenId = r.CitizenId?.Value ?? string.Empty,
                RepresentativeNationality = r.RepresentativeNationality?.Value ?? string.Empty,
                RepresentativeEmail = r.RepresentativeEmail?.Value ?? string.Empty,
                RepresentativePhone = r.RepresentativePhone?.Value ?? string.Empty
            });
        }

        public async Task<IEnumerable<RepresentativeSimpleDto>> GetAllSimplifiedAsync()
        {
            var reps = await _representativeRepository.GetAllAsync();
            var simplifiedList = new List<RepresentativeSimpleDto>();

            foreach (var rep in reps)
            {
                var organizationName = string.Empty;
                if (rep.OrganizationId != null)
                {
                    var org = await _organizationRepository.GetByIdAsync(rep.OrganizationId);
                    organizationName = org?.LegalName?.Value ?? string.Empty;
                }

                simplifiedList.Add(new RepresentativeSimpleDto
                {
                    Name = rep.RepresentativeName?.Value ?? string.Empty,
                    CitizenId = rep.CitizenId?.Value ?? string.Empty,
                    Nationality = rep.RepresentativeNationality?.Value ?? string.Empty,
                    Email = rep.RepresentativeEmail?.Value ?? string.Empty,
                    Phone = rep.RepresentativePhone?.Value ?? string.Empty,
                    OrganizationName = organizationName
                });
            }

            return simplifiedList;
        }

        public async Task<IEnumerable<RepresentativeSimpleDto>> GetSimplifiedByOrganizationIdAsync(string organizationId)
        {
            var orgId = new OrganizationId(Guid.Parse(organizationId));
            var reps = await _representativeRepository.GetByOrganizationIdAsync(orgId);
            
            var org = await _organizationRepository.GetByIdAsync(orgId);
            var organizationName = org?.LegalName?.Value ?? string.Empty;

            return reps.Select(r => new RepresentativeSimpleDto
            {
                Name = r.RepresentativeName?.Value ?? string.Empty,
                CitizenId = r.CitizenId?.Value ?? string.Empty,
                Nationality = r.RepresentativeNationality?.Value ?? string.Empty,
                Email = r.RepresentativeEmail?.Value ?? string.Empty,
                Phone = r.RepresentativePhone?.Value ?? string.Empty,
                OrganizationName = organizationName
            });
        }
        }
    }

