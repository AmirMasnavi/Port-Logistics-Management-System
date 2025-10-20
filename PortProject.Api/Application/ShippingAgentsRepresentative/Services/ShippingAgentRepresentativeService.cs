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

        public ShippingAgentRepresentativeService(IShippingAgentRepresentativeRepository representativeRepository)
        {
            _representativeRepository = representativeRepository;
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
            representative.AttachToOrganization(new OrganizationId(Guid.Parse(dto.OrganizationId)));
            await _representativeRepository.AddAsync(representative);
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
            // EF Core tracks changes, so just save
            await _representativeRepository.AddAsync(representative); // If AddAsync is upsert
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
            var repId = new RepresentativeId(Guid.Parse(id));
            var representative = await _representativeRepository.GetByIdAsync(repId);
            if (representative == null)
                return false;
            // Remove from context and save
            // If repository does not have Remove, use context directly or add method
            // For now, not implemented
            return false;
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
        }
    }

