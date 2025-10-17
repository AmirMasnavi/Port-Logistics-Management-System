namespace PortProject.Api.Domain.VesselVisitNotificationAggregate;

public record ETD
{
    public DateTime Value { get; }
    private ETD() { }
    public ETD(DateTime value) { Value = value; }
}