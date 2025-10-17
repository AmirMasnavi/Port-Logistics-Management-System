using PortProject.Api.Domain.StaffMemberAggregate; // Needed for MecanographicNumber

namespace PortProject.Api.Domain.VesselVisitNotificationAggregate;

public class DecisionLogEntry
{
    public int Id { get; private set; } // Internal ID for EF Core
    public DateTime Timestamp { get; private set; }
    public MecanographicNumber OfficerId { get; private set; }
    public DecisionOutcome Outcome { get; private set; }
    public string? Reason { get; private set; } // Nullable, as it's only required for rejections

    private DecisionLogEntry() { }

    public DecisionLogEntry(DateTime timestamp, MecanographicNumber officerId, DecisionOutcome outcome, string? reason)
    {
        if (outcome == DecisionOutcome.Rejected && string.IsNullOrWhiteSpace(reason))
        {
            throw new ArgumentException("A reason is required for a rejection.", nameof(reason));
        }
        
        Timestamp = timestamp;
        OfficerId = officerId ?? throw new ArgumentNullException(nameof(officerId));
        Outcome = outcome;
        Reason = reason;
    }
}