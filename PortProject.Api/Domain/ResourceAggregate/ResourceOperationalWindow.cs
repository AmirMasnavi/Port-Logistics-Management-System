namespace PortProject.Api.Domain.ResourceAggregate;

public class ResourceOperationalWindow
{
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    
    
    // For EF
    private ResourceOperationalWindow() { }
    
    
    public ResourceOperationalWindow(TimeOnly startTime, TimeOnly endTime)
    {
        if (startTime >= endTime)
            throw new ArgumentException("Start time must be before end time.");
        
        StartTime = startTime;
        EndTime = endTime;
    }
    
    
    public override string ToString()
    {
        return $"{StartTime:HH:mm} - {EndTime:HH:mm}";
    }
}