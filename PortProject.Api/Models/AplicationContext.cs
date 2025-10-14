using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using PortProject.Api.Domain.DockAggregate;
using PortProject.Api.Domain.ShippingAgentOrganizationAggregate;
using PortProject.Api.Domain.ShippingAgentRepresentativeAggregate;
using PortProject.Api.Domain.StaffMemberAggregate;
using PortProject.Api.Domain.VesselAggregate;
using PortProject.Api.Domain.StorageAggregate;
using src.Domain.VesselTypeAggregate;

namespace PortProject.Api.Models;

public class PortProjectContext : DbContext
{
    public PortProjectContext() { }
    public PortProjectContext(DbContextOptions<PortProjectContext> options) : base(options) { }

    public DbSet<VesselType> VesselTypes { get; set; }
    public DbSet<StaffMember> StaffMembers { get; set; }
    public DbSet<Vessel> Vessels { get; set; }
    public DbSet<StorageArea> StorageAreas { get; set; }
    public DbSet<Dock> Docks { get; set; }
    public DbSet<ShippingAgentOrganization> ShippingAgentOrganizations { get; set; }
    public DbSet<ShippingAgentRepresentative> ShippingAgentRepresentatives { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder
            .UseSqlite("Data Source=portproject.db")
            .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
    }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // === SHIPPING AGENT REPRESENTATIVE CONFIGURATION ===
        var repBuilder = modelBuilder.Entity<ShippingAgentRepresentative>();
        repBuilder.HasKey(r => r.RepresentativeId);
        repBuilder.Property(r => r.RepresentativeId)
            .HasConversion(
                id => id.Value,
                value => new RepresentativeId(value))
            .IsRequired();
        repBuilder.Property(r => r.CitizenId)
            .HasConversion(
                id => id.Value,
                value => new CitizenId(value))
            .IsRequired();
        repBuilder.Property(r => r.RepresentativeName)
            .HasConversion(
                name => name.Value,
                value => new RepresentativeName(value))
            .IsRequired();
        repBuilder.Property(r => r.RepresentativePhone)
            .HasConversion(
                phone => phone.Value,
                value => new RepresentativePhone(value))
            .IsRequired();
        repBuilder.Property(r => r.RepresentativeEmail)
            .HasConversion(
                email => email.Value,
                value => new RepresentativeEmail(value))
            .IsRequired();
        repBuilder.Property(r => r.RepresentativeNationality)
            .HasConversion(
                nat => nat.Value,
                value => new RepresentativeNationality(value))
            .IsRequired();
        
        
        
        
        // === SHIPPING AGENT ORGANIZATION CONFIGURATION ===
        var orgBuilder = modelBuilder.Entity<ShippingAgentOrganization>();
        orgBuilder
            .HasMany(o => o.Representatives)
            .WithOne() 
            .HasForeignKey("ShippingAgentOrganizationId")
            .OnDelete(DeleteBehavior.Cascade);
        orgBuilder.HasKey(o => o.Id);
        orgBuilder.Property(o => o.Id)
            .HasConversion(
                id => id.Value,
                value => new OrganizationId(value))
            .IsRequired();
        orgBuilder.Property(o => o.LegalName)
            .HasConversion(
                name => name.Value,
                value => new LegalName(value))
            .IsRequired();
        orgBuilder.Property(o => o.AlternativeName)
            .HasConversion(
                name => name.Value,
                value => new AlternativeName(value))
            .IsRequired();
        orgBuilder.OwnsOne(o => o.Address, addressBuilder =>
        {
            addressBuilder.Property(a => a.Street).HasColumnName("Street").IsRequired();
            addressBuilder.Property(a => a.City).HasColumnName("City").IsRequired();
            addressBuilder.Property(a => a.Country).HasColumnName("Country").IsRequired();
        });
        orgBuilder.Property(o => o.TaxNumber)
            .HasConversion(
                tax => tax.Value,
                value => new TaxNumber(value))
            .IsRequired();
        
        
        
        
        
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

                // TODO: replace with real Qualification entity when ready
                staffMemberBuilder.OwnsMany(sm => sm.Qualifications, ownedBuilder =>
                {
                    ownedBuilder.ToTable("StaffMemberQualifications");
                    ownedBuilder.Property(q => q.Value).HasColumnName("QualificationIdValue");
                });

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
        vesselBuilder.ToTable("Vessels");

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

                storageAreaBuilder.OwnsOne(sa => sa.Capacity, cap =>
                {
                    cap.Property(p => p.Value).HasColumnName("Capacity").IsRequired();
                });

        modelBuilder.ApplyConfiguration(new VesselEntityTypeConfiguration());

                base.OnModelCreating(modelBuilder);
        
        // === DOCK CONFIGURATION ===
        var dockBuilder = modelBuilder.Entity<Dock>();

        dockBuilder.HasKey(d => d.Id);

        dockBuilder.Property(d => d.Id)
            .HasConversion(
                id => id.Value,
                value => new DockId(value))
            .HasColumnName("Id")
            .IsRequired();

        dockBuilder.OwnsOne(d => d.Name, name =>
        {
            name.Property(n => n.Value)
                .HasColumnName("Name")
                .HasMaxLength(100)
                .IsRequired();

            name.HasIndex(n => n.Value).IsUnique();
        });

        dockBuilder.OwnsOne(d => d.Location, location =>
        {
            location.Property(l => l.Zone)
                .HasColumnName("LocationZone")
                .HasMaxLength(50)
                .IsRequired();

            location.Property(l => l.Section)
                .HasColumnName("LocationSection")
                .HasMaxLength(50)
                .IsRequired();
        });

        dockBuilder.OwnsOne(d => d.Characteristics, characteristics =>
        {
            characteristics.Property(c => c.LengthInMeters)
                .HasColumnName("LengthInMeters")
                .IsRequired();

            characteristics.Property(c => c.DepthInMeters)
                .HasColumnName("DepthInMeters")
                .IsRequired();

            characteristics.Property(c => c.MaxDraftInMeters)
                .HasColumnName("MaxDraftInMeters")
                .IsRequired();
        });

        dockBuilder.OwnsOne(d => d.STSCranes, cranes =>
        {
            cranes.Property(c => c.Value)
                .HasColumnName("NumberOfSTSCranes")
                .IsRequired();
        });

// Persist AllowedVesselTypes as CSV string
        dockBuilder.Property(d => d.AllowedVesselTypes)
            .HasConversion(
                list => string.Join(",", list.Select(v => v.Value)),
                value => value.Split(",", StringSplitOptions.RemoveEmptyEntries).Select(v => new VesselTypeId(v)).ToList()
            )
            .HasColumnName("AllowedVesselTypeIds")
            .IsRequired();
    }
}