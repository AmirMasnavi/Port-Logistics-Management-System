using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain;
using PortProject.Api.Domain.StaffMemberAggregate;
using src.Domain.VesselTypeAggregate;
namespace PortProject.Api.Models;

public class PortProjectContext : DbContext
{
    public PortProjectContext() { }
    public PortProjectContext(DbContextOptions<PortProjectContext> options) : base(options) { }


    public DbSet<VesselType> VesselTypes { get; set; }
    public DbSet<StaffMember> StaffMembers { get; set; }
    
    
        // This method is where you configure your database model
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // === STAFF MEMBER CONFIGURATION ===
        // Get a reference to the StaffMember entity builder
        var staffMemberBuilder = modelBuilder.Entity<StaffMember>();

        // --- 1. Define the Primary Key ---
        staffMemberBuilder.HasKey(sm => sm.MecanographicNumber);

        // --- 2. Configure Value Objects to be stored correctly ---
        
        // For MecanographicNumber, we tell EF to use its 'Value' property (a string)
        // when saving to the database, and how to create a MecanographicNumber when reading.
        staffMemberBuilder.Property(sm => sm.MecanographicNumber)
            .HasConversion(
                mecanographicNumber => mecanographicNumber.Value, 
                value => new MecanographicNumber(value))
            .HasMaxLength(20); // Define max length for the database column

        // For ContactDetails, we use OwnsOne. This tells EF that ContactDetails
        // belongs to StaffMember and its properties should be stored as columns
        // in the StaffMembers table (e.g., "Email", "Phone").
        staffMemberBuilder.OwnsOne(sm => sm.ContactDetails, contactBuilder =>
        {
            // Map the Email property from ContactDetails to a column named "Email"
            contactBuilder.Property(cd => cd.Email)
                .HasColumnName("Email")
                .IsRequired();
            
            // Map the Phone property from ContactDetails to a column named "Phone"
            contactBuilder.Property(cd => cd.Phone)
                .HasColumnName("Phone")
                .IsRequired();
        });

        // We do the same for OperationalWindow
        staffMemberBuilder.OwnsOne(sm => sm.OperationalWindow, windowBuilder =>
        {
            windowBuilder.Property(ow => ow.StartTime).IsRequired();
            windowBuilder.Property(ow => ow.EndTime).IsRequired();
            
            // For a collection like WorkingDays, a simple way to store it
            // is to convert it to a single string (e.g., "Monday,Tuesday,Wednesday")
            windowBuilder.Property(ow => ow.WorkingDays)
                .HasConversion(
                    days => string.Join(',', days),
                    dbString => dbString.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(Enum.Parse<DayOfWeek>).ToList()
                );
        });
        
        //TODO: change this after implementing the Qualification entity
        staffMemberBuilder.OwnsMany(sm => sm.Qualifications, ownedBuilder =>
        {
            ownedBuilder.ToTable("StaffMemberQualifications");
            ownedBuilder.Property(q => q.Value).HasColumnName("QualificationIdValue");
        });

        // --- 3. Configure other properties ---
        staffMemberBuilder.Property(sm => sm.ShortName)
            .IsRequired()
            .HasMaxLength(100);

        // We can also tell EF how to handle the enum
        staffMemberBuilder.Property(sm => sm.CurrentStatus)
            .HasConversion<string>() // Store the status as a string (e.g., "Available")
            .IsRequired();

        // === VESSEL TYPE CONFIGURATION ===
        var vesselTypeBuilder = modelBuilder.Entity<VesselType>();

        // --- 1. Define the Primary Key ---
        vesselTypeBuilder.HasKey(vt => vt.Id);

        // --- 2. Configure Value Objects ---
        vesselTypeBuilder.Property(vt => vt.Id)
            .HasConversion(
                id => id.Value,
                value => new VesselTypeId(value))
            .HasColumnName("Id")
            .IsRequired();

        vesselTypeBuilder.OwnsOne(vt => vt.Name, nb =>
        {
            nb.Property(p => p.Value)
                .HasColumnName("Name")
                .HasMaxLength(100)
                .IsRequired();
            nb.HasIndex(p => p.Value).IsUnique();
        });
        
       

        vesselTypeBuilder.OwnsOne(vt => vt.Description, db =>
        {
            db.Property(p => p.Value)
                .HasColumnName("Description")
                .HasMaxLength(255);
        });

        vesselTypeBuilder.OwnsOne(vt => vt.Capacity, cb =>
        {
            cb.Property(p => p.Value)
                .HasColumnName("Capacity")
                .IsRequired();
        });

        // --- 3. Configure Owned Entity for Dimensions ---
        
        vesselTypeBuilder.OwnsOne(vt => vt.OperationalConstraints, oc =>
        {
            
            oc.Property(p => p.MaxRows)
                .HasColumnName("MaxRows")
                .IsRequired();
            oc.Property(p => p.MaxBays)          
                .HasColumnName("MaxBays")           
                .IsRequired();

            oc.Property(p => p.MaxTiers)
                .HasColumnName("MaxTiers")
                .IsRequired();
        });
        

        base.OnModelCreating(modelBuilder);
    }
}