namespace PortProject.Api.Domain.ResourceAggregate;

public class ResourceSetupTime
{
    public int Minutes { get; private set; }
    
    // for EF
    protected ResourceSetupTime() {}
    
    public ResourceSetupTime(int minutes)
    {
        if (minutes < 0) throw new ArgumentOutOfRangeException(nameof(minutes), "Setup time cannot be negative.");
        Minutes = minutes;
    }
    
    public override string ToString()
    {
        return $"{Minutes} minutes";
    }
    
}