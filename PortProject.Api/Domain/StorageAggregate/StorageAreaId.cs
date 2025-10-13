namespace PortProject.Api.Domain.StorageAggregate
{
    public class StorageAreaId
    {
        public int Value { get; }
        
        public StorageAreaId(int value)
        {
            Value = value;
        }
        
        public override string ToString() => Value.ToString();
    }    
}

