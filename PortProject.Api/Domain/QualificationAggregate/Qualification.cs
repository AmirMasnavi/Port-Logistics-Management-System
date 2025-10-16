namespace PortProject.Api.Domain.QualificationAggregate;

// This is the Aggregate Root for Qualification
public class Qualification
{
    public QualificationCode Code { get; private set; }
    public QualificationName Name { get; private set; }
    public QualificationDescription Description { get; private set; }

    // Private constructor for Entity Framework
    private Qualification() 
    {
        Code = null!;
        Name = null!;
        Description = null!;
    }

    // Public constructor to enforce validity
    public Qualification(QualificationCode code, QualificationName name, QualificationDescription description)
    {
        Code = code ?? throw new ArgumentNullException(nameof(code));
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Description = description ?? throw new ArgumentNullException(nameof(description));
    }
    
    // Public methods to allow controlled changes
    public void UpdateName(QualificationName newName)
    {
        Name = newName ?? throw new ArgumentNullException(nameof(newName));
    }

    public void UpdateDescription(QualificationDescription newDescription)
    {
        Description = newDescription ?? throw new ArgumentNullException(nameof(newDescription));
    }
}