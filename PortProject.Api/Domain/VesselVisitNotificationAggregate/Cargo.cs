namespace PortProject.Api.Domain.VesselVisitNotificationAggregate;

public class Cargo
{
    public int Id { get; private set; } // Internal ID
    public string Description { get; private set; }
    public double Weight { get; private set; }

    private readonly List<Container> _containers = new();
    public IReadOnlyCollection<Container> Containers => _containers.AsReadOnly();

    private Cargo() { }
    public Cargo(string description, double weight, List<Container> containers)
    {
        Description = description;
        Weight = weight;
        _containers = containers ?? new List<Container>();
    }
}