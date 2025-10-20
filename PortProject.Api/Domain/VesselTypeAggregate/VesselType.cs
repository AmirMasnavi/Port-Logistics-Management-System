using src.Domain.Shared;
using src.Domain.VesselTypeAggregate;

namespace PortProject.Api.Domain.VesselTypeAggregate
{
    /// <summary>
    /// Represents a VesselType entity in the domain.
    /// </summary>
    public class VesselType : Entity<VesselTypeId>, IAggregateRoot
    {
        public VesselTypeName Name { get; private set; }
        public VesselTypeId Id { get; private set; }
        public VesselTypeDescription Description { get; private set; }
        public VesselTypeCapacity Capacity { get; private set; }
        public VesselTypeDimensions OperationalConstraints { get; private set; }
        

        // Construtor padrão exigido pelo EF Core
        protected VesselType() { }

        // Construtor principal para criar uma nova instância de VesselType
        public VesselType(VesselTypeId id, VesselTypeName name, VesselTypeDescription description, VesselTypeCapacity capacity, VesselTypeDimensions operationalConstraints)
        {
         
            if (id == null) throw new ArgumentNullException(nameof(id));
            if (name == null) throw new ArgumentNullException(nameof(name));
            if (description == null) throw new ArgumentNullException(nameof(description));
            if (capacity == null) throw new ArgumentNullException(nameof(capacity));
            if (operationalConstraints == null) throw new ArgumentNullException(nameof(operationalConstraints));

            Id = id;
            Name = name;
            Description = description;
            Capacity = capacity;
            OperationalConstraints = operationalConstraints;
        }

       
        /// <summary>
        /// Factory method to create a new VesselType.
        /// </summary>
        public static VesselType Create(string id, string name, string description, int capacity, int rows, int bays, int tiers)
        {
            if (string.IsNullOrWhiteSpace(id))
                throw new ArgumentException("Id obrigatório.", nameof(id));
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Name obrigatório.", nameof(name));

            return new VesselType(
                new VesselTypeId(id),
                new VesselTypeName(name),
                new VesselTypeDescription(description),
                new VesselTypeCapacity(capacity),
                new VesselTypeDimensions(rows, bays, tiers)
            );
        }

        /// <summary>
        /// Updates the name of the vessel type.
        /// </summary>
        public void UpdateName(VesselTypeName newName)
        {
            if (newName == null) throw new ArgumentNullException(nameof(newName));
            Name = newName;
        }

        /// <summary>
        /// Updates the description of the vessel type.
        /// </summary>
        public void UpdateDescription(VesselTypeDescription newDescription)
        {
            if (newDescription == null) throw new ArgumentNullException(nameof(newDescription));
            Description = newDescription;
        }

        /// <summary>
        /// Updates the capacity of the vessel type.
        /// </summary>
        public void UpdateCapacity(VesselTypeCapacity newCapacity)
        {
            if (newCapacity == null) throw new ArgumentNullException(nameof(newCapacity));
            Capacity = newCapacity;
        }

        /// <summary>
        /// Updates the operational constraints of the vessel type.
        /// </summary>
        public void UpdateOperationalConstraints(VesselTypeDimensions newConstraints)
        {
            if (newConstraints == null) throw new ArgumentNullException(nameof(newConstraints));
            OperationalConstraints = newConstraints;
        }

        public override string ToString()
        {
            return $"ID: {Id}, Name: {Name}, Description: {Description}, Capacity: {Capacity}, Constraints: {OperationalConstraints}";
        }
    }
}