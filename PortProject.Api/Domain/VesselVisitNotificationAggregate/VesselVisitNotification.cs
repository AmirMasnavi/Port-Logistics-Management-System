// Add using statements for the IDs from other aggregates
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Domain.DockAggregate;
using PortProject.Api.Domain.StaffMemberAggregate;

namespace PortProject.Api.Domain.VesselVisitNotificationAggregate;

public class VesselVisitNotification // We will add inheritance and interfaces later
{
    public NotificationId Id { get; private set; }
    public NotificationStatus Status { get; private set; }
    public ETA EstimatedArrival { get; private set; }
    public ETD EstimatedDeparture { get; private set; }
    
    // --- References to other Aggregates by ID ---
    public ImoNumber VesselId { get; private set; }
    public RepresentativeId SubmittedBy { get; private set; }
    public DockId? AssignedDockId { get; private set; } // Nullable, as it's assigned later

    // --- Owned Entities ---
    public Cargo Cargo { get; private set; }
    private readonly List<CrewMember> _crewMembers = new();
    public IReadOnlyCollection<CrewMember> CrewMembers => _crewMembers.AsReadOnly();
    private readonly List<DecisionLogEntry> _decisionLog = new();
    public IReadOnlyCollection<DecisionLogEntry> DecisionLog => _decisionLog.AsReadOnly();
    // Private constructor for EF Core
    
    private VesselVisitNotification() { }

    // Public constructor for creating a new notification
    private VesselVisitNotification(ETA eta, ETD etd, ImoNumber vesselId, RepresentativeId submittedBy, Cargo cargo, List<CrewMember>? crewMembers)
    {
        Id = new NotificationId(Guid.NewGuid());
        Status = NotificationStatus.InProgress; // Always starts as 'In Progress' [cite: 312]
        EstimatedArrival = eta;
        EstimatedDeparture = etd;
        VesselId = vesselId;
        SubmittedBy = submittedBy;
        Cargo = cargo;
        if (crewMembers != null) // Add provided crew members
        {
            _crewMembers.AddRange(crewMembers);
        }
    }

    // Static Factory Method for clean creation
    public static VesselVisitNotification Create(ETA eta, ETD etd, ImoNumber vesselId, RepresentativeId submittedBy, Cargo cargo, List<CrewMember>? crewMembers)
    {
        // Add any creation-specific business rules here
        if (eta.Value >= etd.Value)
        {
            throw new ArgumentException("Estimated arrival must be before estimated departure.");
        }
        return new VesselVisitNotification(eta, etd, vesselId, submittedBy, cargo, crewMembers);
    }
    
    // --- Business Logic Methods ---
    
    // This method fulfills the "submit" part of US 2.2.8
    public void Submit()
    {
        if (Status != NotificationStatus.InProgress)
        {
            throw new InvalidOperationException("Only notifications 'In Progress' can be submitted.");
        }
        Status = NotificationStatus.Submitted;
    }
    
    // Placeholder for US 2.2.9
    public void UpdateDetails(ETA newEta, ETD newEtd, Cargo newCargo, List<CrewMember>? newCrewMembers)
    {
        if (Status != NotificationStatus.InProgress)
        {
            throw new InvalidOperationException("Only 'In Progress' notifications can be updated.");
        }
        EstimatedArrival = newEta;
        EstimatedDeparture = newEtd;
        Cargo = newCargo;
        _crewMembers.Clear();
        if (newCrewMembers != null)
        {
            _crewMembers.AddRange(newCrewMembers);
        }
    }
    
    public void Approve(MecanographicNumber officerId, DockId dockId)
    {
        if (Status != NotificationStatus.Submitted)
            throw new InvalidOperationException("Only submitted notifications can be approved.");

        Status = NotificationStatus.Approved;
        AssignedDockId = dockId;

        _decisionLog.Add(new DecisionLogEntry(
            DateTime.UtcNow,
            officerId,
            DecisionOutcome.Approved,
            null
        ));
    }

    public void Reject(MecanographicNumber officerId, string reason)
    {
        if (Status != NotificationStatus.Submitted)
            throw new InvalidOperationException("Only submitted notifications can be rejected.");

        Status = NotificationStatus.Rejected;

        _decisionLog.Add(new DecisionLogEntry(
            DateTime.UtcNow,
            officerId,
            DecisionOutcome.Rejected,
            reason
        ));
    }
    public void Reopen()
    {
        if (Status != NotificationStatus.Rejected)
            throw new InvalidOperationException("Only rejected notifications can be reopened.");

        Status = NotificationStatus.Submitted;

        _decisionLog.Add(new DecisionLogEntry(
            DateTime.UtcNow,
            new MecanographicNumber("SYSTEM"), // ou podes passar null se o reopening for automático
            DecisionOutcome.Reopened,
            "Notification reopened for revision by shipping agent."
        ));
    }
    public void AddDecisionLogEntry(DecisionLogEntry entry)
    {
        _decisionLog.Add(entry);
    }
}