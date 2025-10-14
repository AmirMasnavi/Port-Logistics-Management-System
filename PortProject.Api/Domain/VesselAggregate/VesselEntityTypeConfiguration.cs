using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace PortProject.Api.Domain.VesselAggregate
{
    public class VesselEntityTypeConfiguration : IEntityTypeConfiguration<Vessel>
    {
        public void Configure(EntityTypeBuilder<Vessel> builder)
        {
            // Map ImoNumber as string
            builder.Property(v => v.ImoNumber)
                .HasConversion(
                    imoNumber => imoNumber.Value, // to database
                    value => new ImoNumber(value)) // from database
                .IsRequired();

            builder.HasKey(v => v.ImoNumber);
            builder.Property(v => v.Name).IsRequired();
            builder.Property(v => v.VesselTypeId).IsRequired();
            builder.Property(v => v.CreatedAt).IsRequired();
            builder.Property(v => v.UpdatedAt).IsRequired();
        }
    }
}
