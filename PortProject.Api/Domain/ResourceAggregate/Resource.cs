namespace PortProject.Api.Domain.ResourceAggregate;

using PortProject.Api.Domain.QualificationAggregate;

public class Resource
{
    public ResourceCode Code { get; private set; }
    public ResourceDescription Description { get; private set; }
    public ResourceKind Kind { get; private set; }
    public string? AssignedArea { get; private set; }
    public ResourceOperationalCapacity OperationalCapacity { get; private set; }
    public ResourceStatus Status { get; private set; }
    public ResourceSetupTime SetupTime { get; private set; }
    public ResourceOperationalWindow OperationalWindow { get; private set; }
    
    // Use a collection of Qualifications (many-to-many)
    private readonly List<Qualification> _qualifications = new();
    public IReadOnlyCollection<Qualification> Qualifications => _qualifications.AsReadOnly();

    // Backwards-compatible: keep a string-backed list so older tests/seed code that
    // passed qualification codes (strings) continue to work without major changes.
    private readonly List<string> _qualificationRequirementCodes = new();

    // Expose qualification codes (either derived from Qualification entities when present,
    // otherwise from the string-backed list). This matches the previous public API.
    public IReadOnlyCollection<string> QualificationRequirements
    {
        get
        {
            if (_qualifications.Count > 0)
                return _qualifications.Select(q => q.Code.Value).ToList().AsReadOnly();
            return _qualificationRequirementCodes.AsReadOnly();
        }
    }
    
    // Constructor for Entity Framework
    protected Resource() {}
    
    // Preferred constructor taking Qualification entities
    public Resource(ResourceCode code, ResourceDescription description, ResourceKind kind, string? assignedArea, ResourceOperationalCapacity operationalCapacity, ResourceStatus status, ResourceSetupTime setupTime, ResourceOperationalWindow operationalWindow, IEnumerable<Qualification>? qualifications = null)
    {
        Code = code ?? throw new ArgumentNullException(nameof(code));
        Description = description ?? throw new ArgumentNullException(nameof(description));
        Kind = kind;
        AssignedArea = assignedArea;
        OperationalCapacity = operationalCapacity ?? throw new ArgumentNullException(nameof(operationalCapacity));
        Status = status;
        SetupTime = setupTime ?? throw new ArgumentNullException(nameof(setupTime));
        OperationalWindow = operationalWindow ?? throw new ArgumentNullException(nameof(operationalWindow));
        
        if (qualifications != null)
        {
            _qualifications.AddRange(qualifications);
        }
    }

    // Backwards-compatible constructor that accepts qualification codes as strings.
    public Resource(ResourceCode code, ResourceDescription description, ResourceKind kind, string? assignedArea, ResourceOperationalCapacity operationalCapacity, ResourceStatus status, ResourceSetupTime setupTime, ResourceOperationalWindow operationalWindow, IEnumerable<string>? qualificationCodes)
        : this(code, description, kind, assignedArea, operationalCapacity, status, setupTime, operationalWindow, (IEnumerable<Qualification>?)null)
    {
        if (qualificationCodes != null)
        {
            _qualificationRequirementCodes.AddRange(qualificationCodes.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()));
        }
    }
    
    // Qualification management (entity-based)
    public void AddQualification(Qualification qualification)
    {
        if (qualification == null) throw new ArgumentNullException(nameof(qualification));
        if (_qualifications.Any(q => q.Code.Value == qualification.Code.Value)) return;
        _qualifications.Add(qualification);

        // Keep string-backed list in sync (remove legacy-only values)
        _qualificationRequirementCodes.RemoveAll(s => string.Equals(s, qualification.Code.Value, StringComparison.OrdinalIgnoreCase));
    }

    public void RemoveQualification(Qualification qualification)
    {
        if (qualification == null) throw new ArgumentNullException(nameof(qualification));
        var existing = _qualifications.FirstOrDefault(q => q.Code.Value == qualification.Code.Value);
        if (existing != null) _qualifications.Remove(existing);
    }

    // Set qualifications by entity collection
    public void SetQualifications(IEnumerable<Qualification> qualifications)
    {
        _qualifications.Clear();
        if (qualifications != null)
        {
            _qualifications.AddRange(qualifications.Where(q => q != null));
        }

        // Clear legacy string list when working with real Qualification entities
        _qualificationRequirementCodes.Clear();
    }

    // Backwards-compatible: Set qualifications by string codes
    public void SetQualifications(IEnumerable<string> qualificationCodes)
    {
        _qualificationRequirementCodes.Clear();
        if (qualificationCodes != null)
        {
            _qualificationRequirementCodes.AddRange(qualificationCodes
                .Where(q => !string.IsNullOrWhiteSpace(q))
                .Select(q => q.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase));
        }

        // Do not attempt to materialize Qualification entities here;
        // this keeps the domain object lightweight and compatible with existing tests/seeds.
        _qualifications.Clear();
    }
    
    public void UpdateDescription(ResourceDescription newDescription)
    {
        Description = newDescription ?? throw new ArgumentNullException(nameof(newDescription));
    }
    
    public void UpdateOperationalCapacity(ResourceOperationalCapacity newOperationalCapacity)
    {
        OperationalCapacity = newOperationalCapacity ?? throw new ArgumentNullException(nameof(newOperationalCapacity));
    }

    public void AssignArea(string? area)
    {
        AssignedArea = area;
    }

    // Keep methods that operate on status
    public void Activate()
    {
        Status = ResourceStatus.Active;
    }
    
    public void Deactivate()
    {
        Status = ResourceStatus.Inactive;
    }
    
    public void SetUnderMaintenance()
    {
        Status = ResourceStatus.UnderMaintenance;
    }


    public void UpdateStatus(ResourceStatus newStatus)
    {
        Status = newStatus;
    }


    public override string ToString()
    {
        return $"Code: {Code}, Description: {Description}, Kind: {Kind}, Area: {AssignedArea}, OperationalCapacity: {OperationalCapacity}, Status: {Status}, SetupTime: {SetupTime}, OperationalWindow: {OperationalWindow}";
    }
}