namespace PortProject.Api.Domain.QualificationAggregate;

// Value Object for the Qualification's unique code
public record QualificationCode
{
    public string Value { get; }

    public QualificationCode(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Qualification code cannot be null or empty.", nameof(value));
        
        // You could add other rules, like a max length
        if (value.Length > 20)
            throw new ArgumentException("Qualification code cannot exceed 20 characters.", nameof(value));

        Value = value.Trim().ToUpperInvariant();
    }

    public override string ToString() => Value;
}