using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortProject.OEM.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialOemSetup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
