using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortProject.Api.Migrations
{
    /// <inheritdoc />
    public partial class ResourceQualificationManyToMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Qualifications_Resources_ResourceCode",
                table: "Qualifications");

            migrationBuilder.DropIndex(
                name: "IX_Qualifications_ResourceCode",
                table: "Qualifications");

            migrationBuilder.DropColumn(
                name: "ResourceCode",
                table: "Qualifications");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "StorageAreas",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .OldAnnotation("Sqlite:Autoincrement", true);

            migrationBuilder.CreateTable(
                name: "ResourceQualification",
                columns: table => new
                {
                    QualificationsCode = table.Column<string>(type: "TEXT", nullable: false),
                    ResourceCode = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ResourceQualification", x => new { x.QualificationsCode, x.ResourceCode });
                    table.ForeignKey(
                        name: "FK_ResourceQualification_Qualifications_QualificationsCode",
                        column: x => x.QualificationsCode,
                        principalTable: "Qualifications",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ResourceQualification_Resources_ResourceCode",
                        column: x => x.ResourceCode,
                        principalTable: "Resources",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ResourceQualification_ResourceCode",
                table: "ResourceQualification",
                column: "ResourceCode");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ResourceQualification");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "StorageAreas",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .Annotation("Sqlite:Autoincrement", true);

            migrationBuilder.AddColumn<string>(
                name: "ResourceCode",
                table: "Qualifications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Qualifications_ResourceCode",
                table: "Qualifications",
                column: "ResourceCode");

            migrationBuilder.AddForeignKey(
                name: "FK_Qualifications_Resources_ResourceCode",
                table: "Qualifications",
                column: "ResourceCode",
                principalTable: "Resources",
                principalColumn: "Code");
        }
    }
}
