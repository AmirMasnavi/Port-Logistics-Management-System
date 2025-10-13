namespace PortProject.Api.Domain.StorageAggregate
{
    public class StorageAreaId
    {
        public int ID { get; }
        
        public StorageAreaId(int id)
        {
            if (id <= 0)
                throw new ArgumentException("Storage Area ID must be a positive integer.", nameof(id));
            
            ID = id;
        }
        
        public override string ToString() => ID.ToString();
    }    
}

