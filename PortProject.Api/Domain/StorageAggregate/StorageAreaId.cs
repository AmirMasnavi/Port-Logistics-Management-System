namespace PortProject.Api.Domain.StorageAggregate
{
    public class StorageAreaId
    {
        public int Value { get; }
        
        public StorageAreaId(int value)
        {
            if (value <= 0)
                throw new ArgumentException("Storage Area ID must be a positive integer.", nameof(value));
            
            Value = value;
        }
        
        public override string ToString() => Value.ToString();
    }    
}

