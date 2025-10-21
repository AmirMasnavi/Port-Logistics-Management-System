namespace PortProject.Api.Domain.ResourceAggregate;

public class ResourceDescription
{
    public string Description { get; private set; }
    
    public ResourceDescription(string description)
    {
        this.Description = description ?? string.Empty;
    }
    
    protected ResourceDescription() { }
    
    public override bool Equals(object obj)
    {
        if (obj == null || GetType() != obj.GetType())
        {
            return false;
        }

        var other = (ResourceDescription)obj;
        return Description == other.Description;
    }


    public override string ToString()
    {
        return Description;
    }
}