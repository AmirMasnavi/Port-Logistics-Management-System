namespace PortProject.Api.Domain.VesselVisitNotificationAggregate;

public record NotificationId
{
    public Guid Value { get; }

    // Private constructor for EF Core
    private NotificationId() { }

    public NotificationId(Guid value)
    {
        if (value == Guid.Empty)
            throw new ArgumentException("Notification ID cannot be empty.", nameof(value));
        Value = value;
    }
}