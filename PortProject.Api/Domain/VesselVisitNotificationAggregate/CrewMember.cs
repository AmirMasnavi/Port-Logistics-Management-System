namespace PortProject.Api.Domain.VesselVisitNotificationAggregate;

public class CrewMember
{
    public CrewMemberId Id { get; private set; }
    public string Name { get; private set; }
    public string Nationality { get; private set; }
    public bool IsSafetyOfficer { get; private set; } // To fulfill the "dangerous cargo" requirement

    private CrewMember() { }

    public CrewMember(string name, string nationality, bool isSafetyOfficer = false)
    {
        Id = new CrewMemberId(Guid.NewGuid());
        Name = name;
        Nationality = nationality;
        IsSafetyOfficer = isSafetyOfficer;
    }
}