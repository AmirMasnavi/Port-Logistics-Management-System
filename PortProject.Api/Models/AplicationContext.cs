using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
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
            .IsRequired();

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

        base.OnModelCreating(modelBuilder);
    }
}