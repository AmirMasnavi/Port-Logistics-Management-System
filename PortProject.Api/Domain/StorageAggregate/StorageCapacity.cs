namespace PortProject.Api.Domain.StorageAggregate
{
    public class StorageCapacity
    {
        public int Capacity { get; }
        
        public StorageCapacity(int capacity)
        {
            if(capacity <= 0)
                throw new ArgumentException("Capacity must be a positive integer!");
            
            Capacity = capacity;
        }
        
        public override string ToString() => Capacity.ToString();
    }    
}

