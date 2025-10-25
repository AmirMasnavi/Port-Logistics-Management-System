using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortProject.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveQualificationsRequirementColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "QualificationRequirements",
                table: "Resources");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "StorageAreas",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .OldAnnotation("Sqlite:Autoincrement", true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "StorageAreas",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .Annotation("Sqlite:Autoincrement", true);

            migrationBuilder.AddColumn<string>(
                name: "QualificationRequirements",
                table: "Resources",
                type: "TEXT",
                nullable: true);
        }
    }
}
