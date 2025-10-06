using Microsoft.EntityFrameworkCore;
using PortProject.Api.Domain;
using PortProject.Api.Domain.StaffMemberAggregate;

namespace PortProject.Api.Models;

public class PortProjectContext : DbContext
{
    public PortProjectContext() { }
    public PortProjectContext(DbContextOptions<PortProjectContext> options) : base(options) { }


    public DbSet<VesselType> VesselTypes { get; set; }
    public DbSet<StaffMember> StaffMembers { get; set; }
}