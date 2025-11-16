using src.Domain.Shared;

namespace PortProject.Api.Domain.StorageAggregate
{
    public class StorageArea : Entity<int>, IAggregateRoot
    {
        public string Code { get; internal set; } = string.Empty;
        public StorageAreaLocation Location { get; private set; }
        public StorageAreaType Type { get; private set; }
        public StorageCapacity Capacity { get; private set; }
        
        public StorageAreaCurrentOccupancy CurrentOccupancy { get; private set; }
        
        // Constructor for Entity Framework
        protected StorageArea()
        {
            Location = null!;
            Type = default;
            Capacity = null!;
            CurrentOccupancy = new StorageAreaCurrentOccupancy(0);
        }
        
        public StorageArea(StorageAreaLocation location, StorageAreaType type, StorageCapacity capacity, StorageAreaCurrentOccupancy occupancy)
        {
            // check if occupancy exceeds capacity
            if (occupancy.Value > capacity.Value)
                throw new ArgumentOutOfRangeException(nameof(occupancy), "Current occupancy cannot exceed capacity");
            if (capacity == null)
                throw new ArgumentNullException(nameof(capacity));
            Location = location ?? throw new ArgumentNullException(nameof(location));
            Type = type;
            Capacity = capacity ?? throw new ArgumentNullException(nameof(capacity));
            CurrentOccupancy = occupancy ?? throw new ArgumentNullException(nameof(occupancy));
        }
        
        // Convenience overload: defaults occupancy to 0
        public StorageArea(StorageAreaLocation location, StorageAreaType type, StorageCapacity capacity)
            : this(location, type, capacity, new StorageAreaCurrentOccupancy(0)) { }
        
        // Convenience overload: defaults type to Yard
        public StorageArea(StorageAreaLocation location, StorageCapacity capacity, StorageAreaCurrentOccupancy occupancy)
            : this(location, StorageAreaType.Yard, capacity, occupancy) { }
        
        // Convenience overload: defaults type to Yard and occupancy to 0
        public StorageArea(StorageAreaLocation location, StorageCapacity capacity)
            : this(location, StorageAreaType.Yard, capacity, new StorageAreaCurrentOccupancy(0)) { }
        
        // --- Methods to Mutate State ---
        
        public void ChangeLocation(StorageAreaLocation newLocation)
        {
            if (newLocation == null)
                throw new ArgumentNullException(nameof(newLocation));
            
            Location = newLocation;
        }
        
        public void ChangeType(StorageAreaType newType)
        {
            if (!Enum.IsDefined(typeof(StorageAreaType), newType))
                throw new ArgumentException("Invalid storage area type.", nameof(newType));
            Type = newType;
        }
        
        public void ChangeCapacity(StorageCapacity newCapacity)
        {
            if (newCapacity == null)
                throw new ArgumentNullException(nameof(newCapacity));
            
            Capacity = newCapacity;
        }


        public void ChangeCurrentOccupancy(StorageAreaCurrentOccupancy newOccupancy)
        {
            if (newOccupancy == null)
                throw new ArgumentNullException(nameof(newOccupancy));
            
            if (newOccupancy.Value > Capacity.Value)
                throw new ArgumentOutOfRangeException(nameof(newOccupancy));
            
            CurrentOccupancy = newOccupancy;
        }


        public override string ToString()
        {
            return $"Id: {Id} | Location: {Location} | Type: {Type} | Capacity: {Capacity} | Current Occupancy: {CurrentOccupancy}";
        }
    }    
}