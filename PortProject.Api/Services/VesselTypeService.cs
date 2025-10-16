using PortProject.Api.Domain.VesselTypeAggregate;

namespace PortProject.Api.Services;
using src.Application.Services;
using src.Domain.VesselTypeAggregate;
using src.Dto;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;


    public class VesselTypeService : IVesselTypeService
    {
        private readonly IVesselTypeRepository _repository;

        public VesselTypeService(IVesselTypeRepository repository)
        {
            _repository = repository;
        }

        public async Task<VesselTypeDto> CreateVesselTypeAsync(VesselTypeDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));
            if (string.IsNullOrWhiteSpace(dto.Id))
                throw new ArgumentException("Id é obrigatório e deve conter apenas dígitos.", nameof(dto.Id));
            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Name é obrigatório.");

            var entity = VesselType.Create(
                id: dto.Id.Trim(),
                name: dto.Name.Trim(),
                description: string.IsNullOrWhiteSpace(dto.Description) ? string.Empty : dto.Description.Trim(),
                capacity: dto.Capacity,
                rows: dto.MaxRows,
                bays: dto.MaxBays,
                tiers: dto.MaxTiers
            );

            await _repository.AddAsync(entity);
            
            return new VesselTypeDto
            {
                Id = entity.Id.ToString(),
                Name = entity.Name.ToString(),
                Description = entity.Description.ToString(),
                Capacity = entity.Capacity.Value,
                MaxRows = entity.OperationalConstraints.MaxRows,
                MaxBays = entity.OperationalConstraints.MaxBays,
                MaxTiers = entity.OperationalConstraints.MaxTiers
            };
        }

        public async Task<VesselTypeDto> UpdateVesselTypeAsync(VesselTypeDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));
            if (string.IsNullOrWhiteSpace(dto.Id)) throw new ArgumentException("VesselType ID is required for update.", nameof(dto.Id));

            var vesselType = await _repository.GetByIdAsync(new VesselTypeId(dto.Id));
            if (vesselType == null)
            {
                throw new KeyNotFoundException($"Vessel Type with ID '{dto.Id}' not found.");
            }
            
            // Verifica se já existe outro VesselType com o mesmo nome
            var existingVesselTypeByName = await _repository.GetByNameAsync(new VesselTypeName(dto.Name));
            if (existingVesselTypeByName != null && !existingVesselTypeByName.Id.Equals(vesselType.Id))
            {
                throw new InvalidOperationException($"Vessel Type with name '{dto.Name}' already exists for another ID.");
            }


            vesselType.UpdateName(new VesselTypeName(dto.Name));
            vesselType.UpdateDescription(new VesselTypeDescription(dto.Description));
            vesselType.UpdateCapacity(new VesselTypeCapacity(dto.Capacity));
            vesselType.UpdateOperationalConstraints(new VesselTypeDimensions(dto.MaxRows, dto.MaxBays, dto.MaxTiers));

            await _repository.UpdateAsync(vesselType); 
            return ToDto(vesselType);
        }

        public async Task<VesselTypeDto> GetVesselTypeByIdAsync(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) throw new ArgumentException("VesselType ID cannot be null or empty.", nameof(id));

            var vesselType = await _repository.GetByIdAsync(new VesselTypeId(id));
            return vesselType != null ? ToDto(vesselType) : null;
        }

        public async Task<IEnumerable<VesselTypeDto>> GetAllVesselTypesAsync()
        {
            var vesselTypes = await _repository.GetAllAsync();
            return vesselTypes.Select(ToDto);
        }

        public async Task<IEnumerable<VesselTypeDto>> SearchVesselTypesAsync(string searchTerm = null)
        {
            var vesselTypes = await _repository.SearchByCriteriaAsync(searchTerm);
            return vesselTypes.Select(ToDto);
        }

        public async Task DeleteVesselTypeAsync(string id)
        {
            if (string.IsNullOrWhiteSpace(id)) throw new ArgumentException("VesselType ID cannot be null or empty.", nameof(id));

            var vesselType = await _repository.GetByIdAsync(new VesselTypeId(id));
            if (vesselType == null)
            {
                throw new KeyNotFoundException($"Vessel Type with ID '{id}' not found.");
            }
            await _repository.DeleteAsync(vesselType);
        }

        private VesselTypeDto ToDto(VesselType vesselType)
        {
            return new VesselTypeDto
            {
                Id = vesselType.Id.Value,
                Name = vesselType.Name.Value,
                Description = vesselType.Description.Value,
                Capacity = vesselType.Capacity.Value,
                MaxRows = vesselType.OperationalConstraints.MaxRows,
                MaxBays = vesselType.OperationalConstraints.MaxBays,
                MaxTiers = vesselType.OperationalConstraints.MaxTiers
            };
        }
    }
