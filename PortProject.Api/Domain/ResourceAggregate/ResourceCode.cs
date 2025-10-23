namespace PortProject.Api.Domain.ResourceAggregate;

public class ResourceCode
{
    public string Value { get; }
    
    public ResourceCode(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Value cannot be null or whitespace.", nameof(value));
        }
        var normalized = value.Trim().ToLowerInvariant();
        Value = normalized;
    }
    
    // For EF
    protected ResourceCode() { }
    
    
    
    public override string ToString() => Value;
}