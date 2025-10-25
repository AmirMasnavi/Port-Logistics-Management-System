namespace PortProject.Api.Domain.StorageAggregate;

public class StorageAreaCurrentOccupancy
{
    public int Value { get; private set; }
    
    private StorageAreaCurrentOccupancy() { } // For EF Core
    
    public StorageAreaCurrentOccupancy(int value)
    {
        if(value < 0)
            throw new ArgumentException("Current occupancy cannot be negative!");
        
        Value = value;
    }
    
    public override string ToString() => Value.ToString();
}