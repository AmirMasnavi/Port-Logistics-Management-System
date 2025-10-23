namespace PortProject.Api.Domain.ResourceAggregate;

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
    
    private readonly List<string> _qualificationRequirements = new();
    public IReadOnlyCollection<string> QualificationRequirements => _qualificationRequirements.AsReadOnly();
    
    // Constructor for Entity Framework
    protected Resource() {}
    
    public Resource(ResourceCode code, ResourceDescription description, ResourceKind kind, string? assignedArea, ResourceOperationalCapacity operationalCapacity, ResourceStatus status, ResourceSetupTime setupTime, ResourceOperationalWindow operationalWindow, IEnumerable<string> qualificationRequirements = null)
    {
        Code = code ?? throw new ArgumentNullException(nameof(code));
        Description = description ?? throw new ArgumentNullException(nameof(description));
        Kind = kind;
        AssignedArea = assignedArea;
        OperationalCapacity = operationalCapacity ?? throw new ArgumentNullException(nameof(operationalCapacity));
        Status = status;
        SetupTime = setupTime ?? throw new ArgumentNullException(nameof(setupTime));
        OperationalWindow = operationalWindow ?? throw new ArgumentNullException(nameof(operationalWindow));
        
        if (qualificationRequirements != null)
        {
            _qualificationRequirements.AddRange(qualificationRequirements.Where(q => !string.IsNullOrWhiteSpace(q)));
        }
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

    public void SetQualifications(IEnumerable<string> qualifications)
    {
        _qualificationRequirements.Clear();
        if (qualifications != null)
        {
            _qualificationRequirements.AddRange(qualifications.Where(q => !string.IsNullOrWhiteSpace(q)));
        }
    }
    
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


    public override string ToString()
    {
        return $"Code: {Code}, Description: {Description}, Kind: {Kind}, Area: {AssignedArea}, OperationalCapacity: {OperationalCapacity}, Status: {Status}, SetupTime: {SetupTime}, OperationalWindow: {OperationalWindow}";
    }
}