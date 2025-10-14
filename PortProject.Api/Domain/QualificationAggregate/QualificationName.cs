namespace PortProject.Api.Domain.QualificationAggregate;

// Value Object for the Qualification's name
public record QualificationName
{
    public string Value { get; }

    public QualificationName(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Qualification name cannot be null or empty.", nameof(value));
        
        if (value.Length > 100)
            throw new ArgumentException("Qualification name cannot exceed 100 characters.", nameof(value));

        Value = value.Trim();
    }
    
    public override string ToString() => Value;
}