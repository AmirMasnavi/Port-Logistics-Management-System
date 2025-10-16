namespace PortProject.Api.Domain.VesselVisitNotificationAggregate;

public record ContainerCode
{
    public string Value { get; private set; }
    private ContainerCode() { }
    public ContainerCode(string value)
    {
        // TODO: Add full ISO 6346:2022 validation logic here.
        if (string.IsNullOrWhiteSpace(value) || value.Length != 11)
            throw new ArgumentException("Invalid container code format.", nameof(value));
        Value = value.ToUpper();
    }
}