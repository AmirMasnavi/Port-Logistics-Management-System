namespace PortProject.Api.Domain.VesselVisitNotificationAggregate;

public record CrewMemberId
{
    public Guid Value { get; private set; }
    private CrewMemberId() { }
    public CrewMemberId(Guid value)
    {
        if (value == Guid.Empty)
            throw new ArgumentException("Crew Member ID cannot be empty.", nameof(value));
        Value = value;
    }
}