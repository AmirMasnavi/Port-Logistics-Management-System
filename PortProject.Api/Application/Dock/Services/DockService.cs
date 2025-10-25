using PortProject.Api.Application.Dock.DTOs;
using PortProject.Api.Domain.DockAggregate;
using PortProject.Api.Domain.VesselTypeAggregate;
using src.Domain.VesselTypeAggregate;

namespace PortProject.Api.Application.Dock.Services
{
    public class DockService : IDockService
    {
        private readonly IDockRepository _repository;
        private readonly IVesselTypeRepository _vesselTypeRepository;

        public DockService(IDockRepository repository, IVesselTypeRepository vesselTypeRepository)
        {
            _repository = repository;
            _vesselTypeRepository = vesselTypeRepository;
        }

        public async Task<DockDto> CreateDockAsync(DockCreateDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            var allowedIds = (dto.AllowedVesselTypeIds ?? new List<string>())
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => new VesselTypeId(id.Trim()))
                .ToList();

            var validTypes = await _vesselTypeRepository.GetByIdsAsync(allowedIds);
            var validIds = validTypes.Select(v => v.Id).ToList();
            
            var invalidIds = allowedIds
                .Where(id => !validIds.Contains(id))
                .Select(id => id.Value)
                .ToList();

            if (invalidIds.Any())
                throw new ArgumentException($"Invalid VesselTypeIds: {string.Join(", ", invalidIds)}");

            var dock = Domain.DockAggregate.Dock.Create(
                id: dto.Id,
                name: dto.Name,
                locationZone: dto.LocationZone,
                locationSection: dto.LocationSection,
                lengthInMeters: dto.LengthInMeters,
                depthInMeters: dto.DepthInMeters,
                maxDraftInMeters: dto.MaxDraftInMeters,
                numberOfSTSCranes: dto.NumberOfSTSCranes,
                allowedVesselTypeIds: validIds.Select(v => v.Value).ToList()
            );

            await _repository.AddAsync(dock);
            return ToDto(dock);
        }

        public async Task<DockDto> UpdateDockAsync(DockDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Id))
                throw new ArgumentNullException(nameof(dto));

            var dock = await _repository.GetByIdAsync(new DockId(dto.Id));
            if (dock == null)
                throw new KeyNotFoundException($"Dock with ID '{dto.Id}' not found.");

            var allowedIds = (dto.AllowedVesselTypeIds ?? new List<string>())
                .Where(id => !string.IsNullOrWhiteSpace(id))
                .Select(id => new VesselTypeId(id.Trim()))
                .ToList();

            var validTypes = await _vesselTypeRepository.GetByIdsAsync(allowedIds);
            var validIds = validTypes.Select(v => v.Id).ToList();

            dock.UpdateName(new DockName(dto.Name));
            dock.UpdateLocation(new DockLocation(dto.LocationZone, dto.LocationSection));
            dock.UpdateCharacteristics(new PhysicalCharacteristics(dto.LengthInMeters, dto.DepthInMeters, dto.MaxDraftInMeters));
            dock.UpdateSTSCranes(new NumberOfSTSCranes(dto.NumberOfSTSCranes));
            dock.UpdateAllowedVesselTypes(validIds);

            await _repository.UpdateAsync(dock);
            return ToDto(dock);
        }

        public async Task<DockDto?> GetDockByIdAsync(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
                throw new ArgumentException("Dock ID cannot be null or empty.", nameof(id));

            var dock = await _repository.GetByIdAsync(new DockId(id));
            return dock != null ? ToDto(dock) : null;
        }

        public async Task<IEnumerable<DockDto>> SearchDocksAsync(
            string? name,
            string? vesselTypeId,
            string? zone,
            string? section,
            int page,
            int pageSize,
            string? sortBy,
            string? sortOrder)
        {
            var docks = await _repository.SearchByCriteriaAsync(name, vesselTypeId, zone, section, page, pageSize, sortBy, sortOrder);
            return docks.Select(ToDto);
        }

        public async Task<IEnumerable<DockDto>> GetAllDocksAsync()
        {
            var docks = await _repository.GetAllAsync();
            return docks.Select(ToDto);
        }

        public async Task DeleteDockAsync(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
                throw new ArgumentException("Dock ID cannot be null or empty.", nameof(id));

            var dock = await _repository.GetByIdAsync(new DockId(id));
            if (dock == null)
                throw new KeyNotFoundException($"Dock with ID '{id}' not found.");

            await _repository.DeleteAsync(dock);
        }

        private static DockDto ToDto(Domain.DockAggregate.Dock dock) =>
            new DockDto
            {
                Id = dock.Id.Value,
                Name = dock.Name.Value,
                LocationZone = dock.Location.Zone,
                LocationSection = dock.Location.Section,
                LengthInMeters = dock.Characteristics.LengthInMeters,
                DepthInMeters = dock.Characteristics.DepthInMeters,
                MaxDraftInMeters = dock.Characteristics.MaxDraftInMeters,
                NumberOfSTSCranes = dock.STSCranes.Value,
                AllowedVesselTypeIds = dock.AllowedVesselTypes.Select(v => v.Value).ToList()
            };
    }
}
