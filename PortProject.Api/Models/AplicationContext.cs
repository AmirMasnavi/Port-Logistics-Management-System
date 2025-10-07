using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain;
using src.Domain.VesselTypeAggregate;

namespace PortProject.Api.Models;

public class PortProjectContext : DbContext
{
    public PortProjectContext() { }
    public PortProjectContext(DbContextOptions<PortProjectContext> options) : base(options) { }

    public DbSet<VesselType> VesselTypes { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<VesselType>(entity =>
        {
            // Define a chave primária
            entity.HasKey(e => e.Id);

            // Define como o EF Core converte o Value Object (VesselTypeId) para string e vice-versa
            entity.Property(e => e.Id)
                .HasConversion(
                    id => id.AsString(),           // Para gravar no BD
                    id => new VesselTypeId(id))    // Para reconstruir o objeto ao ler
                .HasColumnName("Id")             // Nome da coluna
                .IsRequired();

            // Opcional: configurar os outros value objects
            entity.OwnsOne(e => e.Name, n =>
            {
                n.Property(p => p.Value).HasColumnName("Name").IsRequired();
            });

            entity.OwnsOne(e => e.Description, d =>
            {
                d.Property(p => p.Value).HasColumnName("Description").IsRequired();
            });

            entity.OwnsOne(e => e.Capacity, c =>
            {
                c.Property(p => p.Value).HasColumnName("Capacity").IsRequired();
            });

            entity.OwnsOne(e => e.OperationalConstraints, oc =>
            {
                oc.Property(p => p.Rows).HasColumnName("Rows");
                oc.Property(p => p.Bays).HasColumnName("Bays");
                oc.Property(p => p.Tiers).HasColumnName("Tiers");
            });
        });
    }
    

    
    

   
}