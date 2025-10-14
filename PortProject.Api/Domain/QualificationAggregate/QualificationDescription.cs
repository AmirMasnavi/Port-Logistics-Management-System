namespace PortProject.Api.Domain.QualificationAggregate;

// Value Object for the Qualification's description
public record QualificationDescription
{
    public string Value { get; }

    public QualificationDescription(string value)
    {
        // Description can be long, but not excessively so.
        if (value.Length > 500)
            throw new ArgumentException("Qualification description cannot exceed 500 characters.", nameof(value));

        Value = value.Trim();
    }

    public override string ToString() => Value;
}