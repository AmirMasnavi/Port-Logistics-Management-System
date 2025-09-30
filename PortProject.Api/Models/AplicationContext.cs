using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain;

namespace PortProject.Api.Models;

public class PortProjectContext : DbContext
{
    public PortProjectContext() { }
    public PortProjectContext(DbContextOptions<PortProjectContext> options) : base(options) { }


    public DbSet<VesselType> VesselTypes { get; set; }
}