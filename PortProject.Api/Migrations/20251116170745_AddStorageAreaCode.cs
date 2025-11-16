using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortProject.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStorageAreaCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");
            
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "StorageAreas",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "TEMP-CODE");
            
            migrationBuilder.CreateIndex(
                name: "IX_StorageAreas_Code",
                table: "StorageAreas",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StorageAreas_Code",
                table: "StorageAreas");
                
            migrationBuilder.DropColumn(
                name: "Code",
                table: "StorageAreas");
        }
    }
}
