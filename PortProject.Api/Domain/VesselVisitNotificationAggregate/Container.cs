namespace PortProject.Api.Domain.VesselVisitNotificationAggregate;

public class Container
{
    public int Id { get; private set; } // An internal ID for EF Core
    public ContainerCode Code { get; private set; }
    public string Position { get; private set; } // e.g., "Bay 05, Row 02, Tier 04"

    private Container() { }
    public Container(ContainerCode code, string position)
    {
        Code = code ?? throw new ArgumentNullException(nameof(code));
        Position = position;
    }
}