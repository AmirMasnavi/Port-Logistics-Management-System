using src.Domain.Shared;
using src.Domain.VesselTypeAggregate;

namespace PortProject.Api.Domain.DockAggregate
{
    /// <summary>
    /// Represents a Dock entity in the domain.
    /// </summary>
    public class Dock : Entity<DockId>, IAggregateRoot
    {
        public DockId Id { get; private set; }
        public DockName Name { get; private set; }
        public DockLocation Location { get; private set; }
        public PhysicalCharacteristics Characteristics { get; private set; }
        public NumberOfSTSCranes STSCranes { get; private set; }

        private readonly List<VesselTypeId> _allowedVesselTypes = new();
        public IReadOnlyCollection<VesselTypeId> AllowedVesselTypes => _allowedVesselTypes.AsReadOnly();

        // Construtor padrão exigido pelo EF Core
        protected Dock() { }

        // Construtor principal
        public Dock(DockId id, DockName name, DockLocation location, PhysicalCharacteristics characteristics, NumberOfSTSCranes cranes, List<VesselTypeId> allowedVesselTypes)
        {
            if (id == null) throw new ArgumentNullException(nameof(id));
            if (name == null) throw new ArgumentNullException(nameof(name));
            if (location == null) throw new ArgumentNullException(nameof(location));
            if (characteristics == null) throw new ArgumentNullException(nameof(characteristics));
            if (cranes == null) throw new ArgumentNullException(nameof(cranes));

            Id = id;
            Name = name;
            Location = location;
            Characteristics = characteristics;
            STSCranes = cranes;
            _allowedVesselTypes = allowedVesselTypes?.Distinct().ToList() ?? new List<VesselTypeId>();
        }

        /// <summary>
        /// Factory method to create a new Dock.
        /// </summary>
        public static Dock Create(string? id, string name, string locationZone, string locationSection, double lengthInMeters, double depthInMeters, double maxDraftInMeters, int numberOfSTSCranes, List<string>? allowedVesselTypeIds)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Name obrigatório.", nameof(name));

            var effectiveId = string.IsNullOrWhiteSpace(id) ? Guid.NewGuid().ToString() : id;

            var vesselTypeIds = (allowedVesselTypeIds ?? new List<string>())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => new VesselTypeId(s.Trim()))
                .ToList();

            return new Dock(
                new DockId(effectiveId),
                new DockName(name),
                new DockLocation(locationZone, locationSection),
                new PhysicalCharacteristics(lengthInMeters, depthInMeters, maxDraftInMeters),
                new NumberOfSTSCranes(numberOfSTSCranes),
                vesselTypeIds
            );
        }

        /// <summary>
        /// Updates the name of the dock.
        /// </summary>
        public void UpdateName(DockName newName)
        {
            if (newName == null) throw new ArgumentNullException(nameof(newName));
            Name = newName;
        }

        /// <summary>
        /// Updates the location of the dock.
        /// </summary>
        public void UpdateLocation(DockLocation newLocation)
        {
            if (newLocation == null) throw new ArgumentNullException(nameof(newLocation));
            Location = newLocation;
        }

        /// <summary>
        /// Updates the physical characteristics of the dock.
        /// </summary>
        public void UpdateCharacteristics(PhysicalCharacteristics newCharacteristics)
        {
            if (newCharacteristics == null) throw new ArgumentNullException(nameof(newCharacteristics));
            Characteristics = newCharacteristics;
        }

        /// <summary>
        /// Updates the number of STS cranes.
        /// </summary>
        public void UpdateSTSCranes(NumberOfSTSCranes newCranes)
        {
            if (newCranes == null) throw new ArgumentNullException(nameof(newCranes));
            STSCranes = newCranes;
        }

        /// <summary>
        /// Updates the list of allowed vessel types.
        /// </summary>
        public void UpdateAllowedVesselTypes(List<VesselTypeId> newTypes)
        {
            _allowedVesselTypes.Clear();
            if (newTypes != null)
                _allowedVesselTypes.AddRange(newTypes.Distinct());
        }

        public override string ToString()
        {
            return $"ID: {Id}, Name: {Name}, Location: {Location}, Characteristics: {Characteristics}, STS Cranes: {STSCranes}, Allowed Types: [{string.Join(", ", _allowedVesselTypes.Select(v => v.Value))}]";
        }
    }
}
