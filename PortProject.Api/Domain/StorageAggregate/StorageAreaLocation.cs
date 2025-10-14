namespace PortProject.Api.Domain.StorageAggregate
{
    public class StorageAreaLocation
    {
        public float X { get; }
        public float Y { get; }
        
        private StorageAreaLocation() { } // For EF Core
        
        public StorageAreaLocation(float x, float y)
        {
            if(x <= 0 || y <= 0)
                throw new ArgumentException("Coordinates must be valid!");
            
            X = x;
            Y = y;
        }
        
        public override string ToString() => $"({X}, {Y})";
    }    
}
