using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using PortProject.Api.Domain.QualificationAggregate;
using PortProject.Api.Domain.StaffMemberAggregate;
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Domain.StorageAggregate;
using PortProject.Api.Domain.DockAggregate;
using PortProject.Api.Domain.ResourceAggregate;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Domain.VesselTypeAggregate;
using PortProject.Api.Domain.VesselVisitNotificationAggregate;
using src.Domain.VesselTypeAggregate;
using System.Text.Json;

namespace PortProject.Api.Models;

public class PortProjectContext : DbContext
{
    public PortProjectContext()
    {
    }

    public PortProjectContext(DbContextOptions<PortProjectContext> options) : base(options)
    {
    }

    public DbSet<VesselType> VesselTypes { get; set; }
    public DbSet<StaffMember> StaffMembers { get; set; }
    public DbSet<Vessel> Vessels { get; set; }
    public DbSet<StorageArea> StorageAreas { get; set; }
    public DbSet<Qualification> Qualifications { get; set; }
    public DbSet<Dock> Docks { get; set; }
    public DbSet<ShippingAgentOrganization> ShippingAgentOrganizations { get; set; }
    public DbSet<ShippingAgentRepresentative> ShippingAgentRepresentatives { get; set; }
    public DbSet<VesselVisitNotification> VesselVisitNotifications { get; set; }
    
    public DbSet<Resource> Resources { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder
            .UseSqlite("Data Source=portproject.db")
            .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
    }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Compare by value (order‑insensitive) and snapshot as a List
        var workingDaysComparer = new ValueComparer<IReadOnlyCollection<DayOfWeek>>(
            (l, r) =>
                ReferenceEquals(l, r) ||
                (l != null && r != null && l.OrderBy(x => x).SequenceEqual(r.OrderBy(x => x))),
            v => v == null
                ? 0
                : v.OrderBy(x => x).Aggregate(0, (acc, d) => HashCode.Combine(acc, (int)d)),
            v => v == null ? new List<DayOfWeek>() : v.ToList()
        );

        // Persist WorkingDays as sorted CSV of ints (stable ordering)
        var workingDaysConverter = new ValueConverter<IReadOnlyCollection<DayOfWeek>, string>(
            v => string.Join(",", (v ?? Array.Empty<DayOfWeek>()).OrderBy(x => x).Select(d => ((int)d).ToString())),
            v => (IReadOnlyCollection<DayOfWeek>)(v ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => (DayOfWeek)int.Parse(s))
                .ToList()
        );

        // Optional: SQL Server needs TimeOnly conversion
        var timeConverter = new ValueConverter<TimeOnly, TimeSpan>(
            t => t.ToTimeSpan(),
            ts => TimeOnly.FromTimeSpan(ts)
        );

        // === STAFF MEMBER CONFIGURATION ===
        var staffMemberBuilder = modelBuilder.Entity<StaffMember>();

        // --- QUALIFICATION CONFIGURATION ---
        var qualificationBuilder = modelBuilder.Entity<Qualification>();

        qualificationBuilder.HasKey(q => q.Code);
        qualificationBuilder.Property(q => q.Code)
            .HasConversion(qc => qc.Value, val => new QualificationCode(val))
            .HasMaxLength(20);

        qualificationBuilder.Property(q => q.Name)
            .HasConversion(qn => qn.Value, val => new QualificationName(val))
            .IsRequired()
            .HasMaxLength(100);

        qualificationBuilder.Property(q => q.Description)
            .HasConversion(qd => qd.Value, val => new QualificationDescription(val))
            .HasMaxLength(500);

        staffMemberBuilder.HasKey(sm => sm.MecanographicNumber);

        staffMemberBuilder.Property(sm => sm.MecanographicNumber)
            .HasConversion(
                mecanographicNumber => mecanographicNumber.Value,
                value => new MecanographicNumber(value))
            .HasMaxLength(20);

        staffMemberBuilder.OwnsOne(sm => sm.ContactDetails, contactBuilder =>
        {
            contactBuilder.Property(cd => cd.Email)
                .HasColumnName("Email")
                .IsRequired();

            contactBuilder.Property(cd => cd.Phone)
                .HasColumnName("Phone")
                .IsRequired();
        });

        staffMemberBuilder.OwnsOne(sm => sm.OperationalWindow, windowBuilder =>
        {
            // Apply TimeOnly converter if needed by your provider
            windowBuilder.Property(ow => ow.StartTime)
                .HasConversion(timeConverter)
                .IsRequired();

            windowBuilder.Property(ow => ow.EndTime)
                .HasConversion(timeConverter)
                .IsRequired();

            // Apply value converter + comparer to stop fake changes
            windowBuilder.Property(ow => ow.WorkingDays)
                .HasConversion(workingDaysConverter)
                .Metadata.SetValueComparer(workingDaysComparer);
        });

        staffMemberBuilder
            .HasMany(sm => sm.Qualifications) // A StaffMember has many Qualifications
            .WithMany() // A Qualification can be on many StaffMembers
            .UsingEntity(j => j.ToTable("StaffMemberQualification")); // Name the join table

        staffMemberBuilder.Property(sm => sm.ShortName)
            .IsRequired()
            .HasMaxLength(100);

        staffMemberBuilder.Property(sm => sm.CurrentStatus)
            .HasConversion<string>()
            .IsRequired();

        // === VESSEL TYPE CONFIGURATION ===
        var vesselTypeBuilder = modelBuilder.Entity<VesselType>();

        vesselTypeBuilder.HasKey(vt => vt.Id);

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

        vesselTypeBuilder.OwnsOne(vt => vt.OperationalConstraints, oc =>
        {
            oc.Property(p => p.MaxRows).HasColumnName("MaxRows").IsRequired();
            oc.Property(p => p.MaxBays).HasColumnName("MaxBays").IsRequired();
            oc.Property(p => p.MaxTiers).HasColumnName("MaxTiers").IsRequired();
        });

        // === VESSEL CONFIGURATION ===
        var vesselBuilder = modelBuilder.Entity<Vessel>();

        vesselBuilder.HasKey(v => v.ImoNumber);

        vesselBuilder.Property(v => v.ImoNumber)
            .HasConversion(
                imo => imo.Value,
                value => new ImoNumber(value))
            .HasColumnName("IMO")
            .HasMaxLength(7)
            .IsRequired();

        vesselBuilder.Property(v => v.Name)
            .HasColumnName("Name")
            .HasMaxLength(100)
            .IsRequired();

        vesselBuilder.Property(v => v.VesselTypeId)
            .HasConversion(
                id => id.Value,
                value => new VesselTypeId(value))
            .HasColumnName("VesselTypeId")
            .IsRequired();

        vesselBuilder.HasOne<VesselType>()
            .WithMany()
            .HasForeignKey(v => v.VesselTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        vesselBuilder.OwnsOne(v => v.Operator, op =>
        {
            op.Property(o => o.Value)
                .HasColumnName("OperatorName")
                .HasMaxLength(100)
                .IsRequired();
        });

        vesselBuilder.Property(v => v.CreatedAt)
            .HasColumnName("CreatedAt")
            .IsRequired();

        vesselBuilder.Property(v => v.UpdatedAt)
            .HasColumnName("UpdatedAt")
            .IsRequired();

        // === STORAGE AREA CONFIGURATION ===
        var storageAreaBuilder = modelBuilder.Entity<StorageArea>();

        storageAreaBuilder.HasKey(storageArea => storageArea.Id);

        storageAreaBuilder.Property(storageArea => storageArea.Id)
            .HasConversion(
                id => id.Value,
                value => new StorageAreaId(value))
            .ValueGeneratedOnAdd()
            .IsRequired().HasAnnotation("Sqlite:Autoincrement", true);

        storageAreaBuilder.Property(sa => sa.Type)
            .HasConversion<string>()
            .IsRequired();

        storageAreaBuilder.OwnsOne(sa => sa.Location, loc =>
        {
            loc.Property(p => p.X).HasColumnName("X").IsRequired();
            loc.Property(p => p.Y).HasColumnName("Y").IsRequired();
        });

        storageAreaBuilder.OwnsOne(sa => sa.Capacity,
            cap => { cap.Property(p => p.Value).HasColumnName("Capacity").IsRequired(); });

        // === DOCK CONFIGURATION ===
        var dockBuilder = modelBuilder.Entity<Dock>();

        // 1. Define the Primary Key (This is the direct fix for your error)
        dockBuilder.HasKey(d => d.Id);

        // 2. Configure the Primary Key's Value Object
        dockBuilder.Property(d => d.Id)
            .HasConversion(id => id.Value, val => new DockId(val));

        // 3. Configure the other owned Value Objects
        dockBuilder.OwnsOne(d => d.Name, nb => { nb.Property(p => p.Value).HasColumnName("DockName").IsRequired(); });

        dockBuilder.OwnsOne(d => d.Location, lb =>
        {
            lb.Property(p => p.Zone).HasColumnName("LocationZone");
            lb.Property(p => p.Section).HasColumnName("LocationSection");
        });

        dockBuilder.OwnsOne(d => d.Characteristics, cb =>
        {
            cb.Property(p => p.LengthInMeters).HasColumnName("Length");
            cb.Property(p => p.DepthInMeters).HasColumnName("Depth");
            cb.Property(p => p.MaxDraftInMeters).HasColumnName("MaxDraft");
        });

        dockBuilder.OwnsOne(d => d.STSCranes, sb => { sb.Property(p => p.Value).HasColumnName("NumberOfSTSCranes"); });

        // 4. Configure the collection of allowed VesselType IDs
        dockBuilder.OwnsMany(d => d.AllowedVesselTypes, ab =>
        {
            ab.ToTable("DockAllowedVesselTypes"); // Create a separate table for this list
            ab.WithOwner().HasForeignKey("DockId"); // Link back to the Dock
            ab.Property(vt => vt.Value).HasColumnName("VesselTypeId");
            ab.HasKey("DockId", "Value"); // Create a composite key for the new table
        });


        // === SHIPPING AGENT ORGANIZATION CONFIGURATION ===
        var orgBuilder = modelBuilder.Entity<ShippingAgentOrganization>();

        // 1. Define the Primary Key
        orgBuilder.HasKey(o => o.Id);
        orgBuilder.Property(o => o.Id)
            .HasConversion(id => id.Value, val => new OrganizationId(val));

        // 2. Configure the simple Value Objects to map to single columns
        orgBuilder.Property(o => o.LegalName)
            .HasConversion(ln => ln.Value, val => new LegalName(val))
            .HasColumnName("LegalName")
            .IsRequired();

        orgBuilder.Property(o => o.AlternativeName)
            .HasConversion(an => an.Value, val => new AlternativeName(val))
            .HasColumnName("AlternativeName");

        orgBuilder.Property(o => o.TaxNumber)
            .HasConversion(tn => tn.Value, val => new TaxNumber(val))
            .HasColumnName("TaxNumber")
            .IsRequired();

        // 3. Configure the complex Address Value Object as an owned type
        orgBuilder.OwnsOne(o => o.Address, ab =>
        {
            // Assuming property names inside Address are Street, City, etc. Adjust if needed.
            ab.Property(a => a.Street).HasColumnName("Address_Street");
            ab.Property(a => a.City).HasColumnName("Address_City");
            ab.Property(a => a.Country).HasColumnName("Address_Country");
        });

        // 4. Configure the one-to-many relationship with Representatives
        // This assumes ShippingAgentRepresentative has a foreign key property pointing back to the organization.
     //   orgBuilder.HasMany(o => o.Representatives)
       //     .WithOne() // Or .WithOne(r => r.Organization) if there's a back-reference
         //   .HasForeignKey(r => r.OrganizationId) // Use explicit FK property on the entity
           // .IsRequired();


        // === SHIPPING AGENT REPRESENTATIVE CONFIGURATION ===
        var repBuilder = modelBuilder.Entity<ShippingAgentRepresentative>();

        // 1. Define the Primary Key
        repBuilder.HasKey(r => r.RepresentativeId);
        repBuilder.Property(r => r.RepresentativeId)
            .HasConversion(id => id.Value, val => new RepresentativeId(val));

        // 2. Configure all the simple Value Objects to map to single columns
        repBuilder.Property(r => r.CitizenId)
            .HasConversion(cid => cid.Value, val => new CitizenId(val))
            .HasColumnName("CitizenId")
            .IsRequired();

        repBuilder.Property(r => r.RepresentativeName)
            .HasConversion(name => name.Value, val => new RepresentativeName(val))
            .HasColumnName("RepresentativeName")
            .IsRequired();

        repBuilder.Property(r => r.RepresentativeEmail)
            .HasConversion(email => email.Value, val => new RepresentativeEmail(val))
            .HasColumnName("RepresentativeEmail")
            .IsRequired();

        repBuilder.Property(r => r.RepresentativePhone)
            .HasConversion(phone => phone.Value, val => new RepresentativePhone(val))
            .HasColumnName("RepresentativePhone")
            .IsRequired();

        repBuilder.Property(r => r.RepresentativeNationality)
            .HasConversion(nat => nat.Value, val => new RepresentativeNationality(val))
            .HasColumnName("RepresentativeNationality")
            .IsRequired();

        // Explicitly map the OrganizationId value object as the FK column
        repBuilder.Property(r => r.OrganizationId)
            .HasConversion(id => id.Value, val => new OrganizationId(val))
            .HasColumnName("OrganizationId")
            .IsRequired();

        // === VESSEL VISIT NOTIFICATION CONFIGURATION ===
        var vvnBuilder = modelBuilder.Entity<VesselVisitNotification>();

        // 1. Primary Key
        vvnBuilder.HasKey(vvn => vvn.Id);
        vvnBuilder.Property(vvn => vvn.Id)
            .HasConversion(id => id.Value, val => new NotificationId(val));

        // 2. Foreign Keys to other Aggregates
        vvnBuilder.Property(vvn => vvn.VesselId)
            .HasConversion(id => id.Value, val => new ImoNumber(val))
            .IsRequired();
        vvnBuilder.HasOne<Vessel>()
            .WithMany()
            .HasForeignKey(vvn => vvn.VesselId);

        vvnBuilder.Property(vvn => vvn.SubmittedBy)
            .HasConversion(id => id.Value, val => new RepresentativeId(val))
            .IsRequired();
        vvnBuilder.HasOne<ShippingAgentRepresentative>()
            .WithMany()
            .HasForeignKey(vvn => vvn.SubmittedBy);

        // 3. Simple Value Objects & Enums
        vvnBuilder.Property(vvn => vvn.Status)
            .HasConversion(status => status.ToString(), str => Enum.Parse<NotificationStatus>(str));

        vvnBuilder.OwnsOne(vvn => vvn.EstimatedArrival, etaBuilder =>
        {
            etaBuilder.Property(p => p.Value)
                .HasColumnName("ETA")
                .IsRequired();
        });

        vvnBuilder.OwnsOne(vvn => vvn.EstimatedDeparture, etdBuilder =>
        {
            etdBuilder.Property(p => p.Value)
                .HasColumnName("ETD")
                .IsRequired();
        });

        // 4. Dock assignment
        vvnBuilder.Property(vvn => vvn.AssignedDockId)
            .HasConversion(id => id.Value, val => new DockId(val))
            .IsRequired(false);

        vvnBuilder.HasOne<Dock>()
            .WithMany()
            .HasForeignKey(vvn => vvn.AssignedDockId)
            .OnDelete(DeleteBehavior.SetNull);

        // 5. Owned Entity: Cargo
        vvnBuilder.OwnsOne(vvn => vvn.Cargo, cargoBuilder =>
        {
            cargoBuilder.Property(c => c.Description).IsRequired();
            cargoBuilder.Property(c => c.Weight).IsRequired();

            cargoBuilder.OwnsMany(c => c.Containers, containerBuilder =>
            {
                containerBuilder.ToTable("Containers");
                containerBuilder.WithOwner().HasForeignKey("VvnId");
                containerBuilder.HasKey("Id");
                containerBuilder.Property(p => p.Code)
                    .HasConversion(cc => cc.Value, v => new ContainerCode(v))
                    .HasColumnName("ContainerCode")
                    .IsRequired();
                containerBuilder.Property(p => p.Position).IsRequired();
            });
        });

        // 6. Owned Collection: CrewMembers
        vvnBuilder.OwnsMany(vvn => vvn.CrewMembers, cmBuilder =>
        {
            cmBuilder.ToTable("CrewMembers");
            cmBuilder.WithOwner().HasForeignKey("VvnId");
            cmBuilder.HasKey(cm => cm.Id);
            cmBuilder.Property(cm => cm.Id)
                .HasConversion(id => id.Value, val => new CrewMemberId(val));
            cmBuilder.Property(cm => cm.Name).IsRequired();
            cmBuilder.Property(cm => cm.Nationality).IsRequired();
            cmBuilder.Property(cm => cm.IsSafetyOfficer).IsRequired();
        });

        // 7. Owned Collection: DecisionLog
        vvnBuilder.OwnsMany(vvn => vvn.DecisionLog, dlBuilder =>
        {
            dlBuilder.ToTable("DecisionLogEntries");
            dlBuilder.WithOwner().HasForeignKey("VvnId");
            dlBuilder.HasKey("Id");
            dlBuilder.Property(dl => dl.Timestamp).IsRequired();
            dlBuilder.Property(dl => dl.Outcome)
                .HasConversion(outcome => outcome.ToString(), str => Enum.Parse<DecisionOutcome>(str))
                .IsRequired();
            dlBuilder.Property(dl => dl.Reason);
            dlBuilder.Property(dl => dl.OfficerId)
                .HasConversion(id => id.Value, val => new MecanographicNumber(val))
                .IsRequired();
        });

        // === RESOURCE CONFIGURATION ===
        var resourceBuilder = modelBuilder.Entity<PortProject.Api.Domain.ResourceAggregate.Resource>();

        // Primary key on Code (Value Object -> string)
        resourceBuilder.HasKey(r => r.Code);
        resourceBuilder.Property(r => r.Code)
            .HasConversion(
                code => code.Value,
                val => new PortProject.Api.Domain.ResourceAggregate.ResourceCode(val))
            .HasColumnName("Code")
            .HasMaxLength(50)
            .IsRequired();

        // Simple enums and scalars
        resourceBuilder.Property(r => r.Kind)
            .HasConversion<string>()
            .HasColumnName("Kind")
            .IsRequired();

        resourceBuilder.Property(r => r.Status)
            .HasConversion<string>()
            .HasColumnName("Status")
            .IsRequired();

        resourceBuilder.Property(r => r.AssignedArea)
            .HasColumnName("AssignedArea")
            .HasMaxLength(100);

        // Description as owned value object
        resourceBuilder.OwnsOne(r => r.Description, db =>
        {
            db.Property(p => p.Description)
                .HasColumnName("Description")
                .HasMaxLength(255)
                .IsRequired();
        });

        // SetupTime as owned value object
        resourceBuilder.OwnsOne(r => r.SetupTime, sb =>
        {
            sb.Property(p => p.Minutes)
                .HasColumnName("SetupTimeMinutes")
                .IsRequired();
        });

        // OperationalWindow as owned value object (TimeOnly via converter)
        resourceBuilder.OwnsOne(r => r.OperationalWindow, wb =>
        {
            wb.Property(p => p.StartTime)
                .HasColumnName("OperationalStart")
                .HasConversion(timeConverter)
                .IsRequired();

            wb.Property(p => p.EndTime)
                .HasColumnName("OperationalEnd")
                .HasConversion(timeConverter)
                .IsRequired();
        });

        // OperationalCapacity as owned value object
        resourceBuilder.OwnsOne(r => r.OperationalCapacity, cb =>
        {
            cb.Property(p => p.Kind)
                .HasConversion<string>()
                .HasColumnName("CapacityKind")
                .IsRequired();

            cb.Property(p => p.AverageContainersPerHour)
                .HasColumnName("AvgContainersPerHour");

            cb.Property(p => p.ContainersPerTrip)
                .HasColumnName("ContainersPerTrip");

            cb.Property(p => p.AverageSpeedKmh)
                .HasColumnName("AverageSpeedKmh");

            cb.Property(p => p.Unit)
                .HasColumnName("CapacityUnit")
                .HasMaxLength(50);

            cb.Property(p => p.GenericValue)
                .HasColumnName("CapacityValue");
        });

        // QualificationRequirements stored as CSV string in a single column using backing field
        var stringListConverter = new ValueConverter<List<string>, string>(
            v => string.Join("|", (v ?? new List<string>()).Where(s => !string.IsNullOrWhiteSpace(s))),
            v => string.IsNullOrWhiteSpace(v)
                ? new List<string>()
                : v.Split('|', StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
        );

        var stringListComparer = new ValueComparer<List<string>>(
            (l, r) => ReferenceEquals(l, r) || (l != null && r != null && l.OrderBy(x => x).SequenceEqual(r.OrderBy(x => x))),
            v => v == null ? 0 : v.OrderBy(x => x).Aggregate(0, (acc, s) => HashCode.Combine(acc, (s == null ? 0 : s.GetHashCode()))),
            v => v == null ? new List<string>() : v.ToList()
        );

        resourceBuilder.Property<List<string>>("_qualificationRequirements")
            .HasColumnName("QualificationRequirements")
            .HasConversion(stringListConverter)
            .Metadata.SetValueComparer(stringListComparer);

        // Ignore the public read-only property to avoid EF trying to map it
        resourceBuilder.Ignore(r => r.QualificationRequirements);

        // Optional: default table name
        resourceBuilder.ToTable("Resources");

        base.OnModelCreating(modelBuilder);
    }
}
