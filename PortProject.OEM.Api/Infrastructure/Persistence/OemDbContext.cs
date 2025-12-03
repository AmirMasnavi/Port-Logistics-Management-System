using Microsoft.EntityFrameworkCore;

namespace PortProject.OEM.Api.Infrastructure.Persistence;

public class OemDbContext : DbContext
{
    public OemDbContext(DbContextOptions<OemDbContext> options) : base(options)
    {
    }

    // Phase 4.1.1 essentially creates the shell. 
    // You will add DbSet<OperationPlan> here in the next steps (US 4.1.2)
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Configurations will go here
    }
}