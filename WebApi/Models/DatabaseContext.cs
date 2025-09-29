using Microsoft.EntityFrameworkCore;

namespace WebApi.Models
{
    public class DatabaseContext : DbContext
    {
        public DatabaseContext(DbContextOptions<DatabaseContext> options)
            : base(options)
        {
        }

        // Change WebItem to your actual model, e.g., TodoItem
        public DbSet<TodoItem> TodoItems { get; set; }
    }
}