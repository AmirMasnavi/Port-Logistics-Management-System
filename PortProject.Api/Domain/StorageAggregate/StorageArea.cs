namespace PortProject.Api.Domain.StorageAggregate
{
    public class StorageArea
    {
        public StorageAreaLocation Location { get; private set; }
        public StorageAreaType Type { get; private set; }
        public StorageCapacity Capacity { get; private set; }
        public StorageAreaId Id { get; private set; }
        
        // Constructor for Entity Framework
        protected StorageArea()
        {
            Location = null!;
            Type = default;
            Capacity = null!;
            Id = null!;
        }
        
        public StorageArea(StorageAreaLocation location, StorageAreaType type, StorageCapacity capacity)
        {
            Location = location ?? throw new ArgumentNullException(nameof(location));
            Type = type;
            Capacity = capacity ?? throw new ArgumentNullException(nameof(capacity));
        }
        
        
        // Convenience overload: defaults type to Yard
        public StorageArea(StorageAreaLocation location, StorageCapacity capacity)
            : this(location, StorageAreaType.Yard, capacity) { }
        
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


        public override string ToString()
        {
            return $"Id: {Id} | Location: {Location} | Type: {Type} | Capacity: {Capacity}";
        }
    }    
}