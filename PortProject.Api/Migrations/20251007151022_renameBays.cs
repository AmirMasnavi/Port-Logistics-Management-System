using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortProject.Api.Migrations
{
    /// <inheritdoc />
    public partial class renameBays : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "MaxTiers",
                table: "VesselTypes",
                newName: "Tiers");

            migrationBuilder.RenameColumn(
                name: "MaxRows",
                table: "VesselTypes",
                newName: "Rows");

            migrationBuilder.RenameColumn(
                name: "MaxBays",
                table: "VesselTypes",
                newName: "Bays");

            migrationBuilder.AlterColumn<string>(
                name: "Id",
                table: "VesselTypes",
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .OldAnnotation("Sqlite:Autoincrement", true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Tiers",
                table: "VesselTypes",
                newName: "MaxTiers");

            migrationBuilder.RenameColumn(
                name: "Rows",
                table: "VesselTypes",
                newName: "MaxRows");

            migrationBuilder.RenameColumn(
                name: "Bays",
                table: "VesselTypes",
                newName: "MaxBays");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "VesselTypes",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT")
                .Annotation("Sqlite:Autoincrement", true);
        }
    }
}
