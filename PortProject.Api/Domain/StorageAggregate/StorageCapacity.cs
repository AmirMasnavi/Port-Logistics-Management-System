namespace PortProject.Api.Domain.StorageAggregate
{
    public class StorageCapacity
    {
        public int Value { get; private set; }
        
        private StorageCapacity() { } // For EF Core
        
        public StorageCapacity(int value)
        {
            if(value <= 0)
                throw new ArgumentException("Capacity must be a positive integer!");
            
            Value = value;
        }
        
        public override string ToString() => Value.ToString();
    }    
}
