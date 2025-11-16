using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortProject.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessIdToVvn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "BusinessId",
                table: "VesselVisitNotifications",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_VesselVisitNotifications_BusinessId",
                table: "VesselVisitNotifications",
                column: "BusinessId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VesselVisitNotifications_BusinessId",
                table: "VesselVisitNotifications");

            migrationBuilder.DropColumn(
                name: "BusinessId",
                table: "VesselVisitNotifications");
        }
    }
}
