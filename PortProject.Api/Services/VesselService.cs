using PortProject.Api.Domain.VesselAggregate;
using src.Domain.VesselTypeAggregate;
using src.Dto;
using src.Application.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PortProject.Api.Domain.VesselTypeAggregate;

namespace PortProject.Api.Services
{
    public class VesselService : IVesselService
    {
        private readonly IVesselRepository _repository;
        private readonly IVesselTypeRepository _vesselTypeRepository;

        public VesselService(IVesselRepository repository, IVesselTypeRepository vesselTypeRepository)
        {
            _repository = repository;
            _vesselTypeRepository = vesselTypeRepository;
        }

        public async Task<VesselDto> CreateVesselAsync(VesselCreateDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            var imo = new ImoNumber(dto.ImoNumber);
            var existing = await _repository.GetByImoAsync(imo);
            if (existing != null)
                throw new InvalidOperationException($"A vessel with IMO '{dto.ImoNumber}' already exists.");

            var vesselType = await _vesselTypeRepository.GetByIdAsync(new VesselTypeId(dto.VesselTypeId));
            if (vesselType == null)
                throw new ArgumentException($"Vessel type '{dto.VesselTypeId}' does not exist.");

            var entity = Vessel.Create(
                imo: dto.ImoNumber,
                name: dto.Name,
                vesselTypeId: dto.VesselTypeId,
                operatorName: dto.Operator
            );

            await _repository.AddAsync(entity);
            return ToDto(entity);
        }

        public async Task<VesselDto> UpdateVesselAsync(VesselDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));
            var imo = new ImoNumber(dto.ImoNumber);

            var vessel = await _repository.GetByImoAsync(imo);
            if (vessel == null)
                throw new KeyNotFoundException($"Vessel with IMO '{dto.ImoNumber}' not found.");

            var vesselType = await _vesselTypeRepository.GetByIdAsync(new VesselTypeId(dto.VesselTypeId));
            if (vesselType == null)
                throw new ArgumentException($"Vessel type '{dto.VesselTypeId}' not found.");

            vessel.UpdateName(dto.Name);
            vessel.UpdateVesselType(new VesselTypeId(dto.VesselTypeId));
            vessel.UpdateOperator(new VesselOperator(dto.Operator));

            await _repository.UpdateAsync(vessel);
            return ToDto(vessel);
        }

        public async Task<VesselDto?> GetVesselByImoAsync(string imo)
        {
            if (string.IsNullOrWhiteSpace(imo))
                throw new ArgumentException("IMO number cannot be null or empty.", nameof(imo));

            var vessel = await _repository.GetByImoAsync(new ImoNumber(imo));
            return vessel != null ? ToDto(vessel) : null;
        }

        public async Task<IEnumerable<VesselDto>> SearchVesselsAsync(string? imo = null, string? name = null, string? operatorName = null)
        {
            var vessels = await _repository.SearchByCriteriaAsync(imo, name, operatorName);
            return vessels.Select(ToDto);
        }

        public async Task DeleteVesselAsync(string imo)
        {
            if (string.IsNullOrWhiteSpace(imo))
                throw new ArgumentException("IMO number cannot be null or empty.", nameof(imo));

            var vessel = await _repository.GetByImoAsync(new ImoNumber(imo));
            if (vessel == null)
                throw new KeyNotFoundException($"Vessel with IMO '{imo}' not found.");

            await _repository.DeleteAsync(vessel);
        }

        private static VesselDto ToDto(Vessel v) =>
            new VesselDto
            {
                ImoNumber = v.ImoNumber.Value,
                Name = v.Name,
                VesselTypeId = v.VesselTypeId.Value,
                Operator = v.Operator.Value
            };
    }
}
