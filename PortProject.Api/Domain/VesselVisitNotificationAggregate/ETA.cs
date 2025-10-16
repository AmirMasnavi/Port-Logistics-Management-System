namespace PortProject.Api.Domain.VesselVisitNotificationAggregate;

// For ETA (Estimated Time of Arrival)
public record ETA
{
    public DateTime Value { get; }
    private ETA() { }
    public ETA(DateTime value) { Value = value; }
}