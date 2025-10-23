using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortProject.Api.Migrations
{
    /// <inheritdoc />
    public partial class ResourcesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ShippingAgentRepresentatives_ShippingAgentOrganizations_OrganizationId",
                table: "ShippingAgentRepresentatives");

            migrationBuilder.DropIndex(
                name: "IX_ShippingAgentRepresentatives_OrganizationId",
                table: "ShippingAgentRepresentatives");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "StorageAreas",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .OldAnnotation("Sqlite:Autoincrement", true);

            migrationBuilder.CreateTable(
                name: "Resources",
                columns: table => new
                {
                    Code = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Kind = table.Column<string>(type: "TEXT", nullable: false),
                    AssignedArea = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    CapacityKind = table.Column<string>(type: "TEXT", nullable: false),
                    AvgContainersPerHour = table.Column<int>(type: "INTEGER", nullable: true),
                    ContainersPerTrip = table.Column<int>(type: "INTEGER", nullable: true),
                    AverageSpeedKmh = table.Column<double>(type: "REAL", nullable: true),
                    CapacityUnit = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    CapacityValue = table.Column<double>(type: "REAL", nullable: true),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    SetupTimeMinutes = table.Column<int>(type: "INTEGER", nullable: false),
                    OperationalStart = table.Column<TimeSpan>(type: "TEXT", nullable: false),
                    OperationalEnd = table.Column<TimeSpan>(type: "TEXT", nullable: false),
                    QualificationRequirements = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Resources", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "VesselVisitNotifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", nullable: false),
                    ETA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ETD = table.Column<DateTime>(type: "TEXT", nullable: false),
                    VesselId = table.Column<string>(type: "TEXT", nullable: false),
                    SubmittedBy = table.Column<Guid>(type: "TEXT", nullable: false),
                    AssignedDockId = table.Column<string>(type: "TEXT", nullable: true),
                    Cargo_Id = table.Column<int>(type: "INTEGER", nullable: false),
                    Cargo_Description = table.Column<string>(type: "TEXT", nullable: false),
                    Cargo_Weight = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VesselVisitNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VesselVisitNotifications_Docks_AssignedDockId",
                        column: x => x.AssignedDockId,
                        principalTable: "Docks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_VesselVisitNotifications_ShippingAgentRepresentatives_SubmittedBy",
                        column: x => x.SubmittedBy,
                        principalTable: "ShippingAgentRepresentatives",
                        principalColumn: "RepresentativeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VesselVisitNotifications_Vessels_VesselId",
                        column: x => x.VesselId,
                        principalTable: "Vessels",
                        principalColumn: "IMO",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Containers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ContainerCode = table.Column<string>(type: "TEXT", nullable: false),
                    Position = table.Column<string>(type: "TEXT", nullable: false),
                    VvnId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Containers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Containers_VesselVisitNotifications_VvnId",
                        column: x => x.VvnId,
                        principalTable: "VesselVisitNotifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CrewMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Nationality = table.Column<string>(type: "TEXT", nullable: false),
                    IsSafetyOfficer = table.Column<bool>(type: "INTEGER", nullable: false),
                    VvnId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CrewMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CrewMembers_VesselVisitNotifications_VvnId",
                        column: x => x.VvnId,
                        principalTable: "VesselVisitNotifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DecisionLogEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    OfficerId = table.Column<string>(type: "TEXT", nullable: false),
                    Outcome = table.Column<string>(type: "TEXT", nullable: false),
                    Reason = table.Column<string>(type: "TEXT", nullable: true),
                    VvnId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DecisionLogEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DecisionLogEntries_VesselVisitNotifications_VvnId",
                        column: x => x.VvnId,
                        principalTable: "VesselVisitNotifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Containers_VvnId",
                table: "Containers",
                column: "VvnId");

            migrationBuilder.CreateIndex(
                name: "IX_CrewMembers_VvnId",
                table: "CrewMembers",
                column: "VvnId");

            migrationBuilder.CreateIndex(
                name: "IX_DecisionLogEntries_VvnId",
                table: "DecisionLogEntries",
                column: "VvnId");

            migrationBuilder.CreateIndex(
                name: "IX_VesselVisitNotifications_AssignedDockId",
                table: "VesselVisitNotifications",
                column: "AssignedDockId");

            migrationBuilder.CreateIndex(
                name: "IX_VesselVisitNotifications_SubmittedBy",
                table: "VesselVisitNotifications",
                column: "SubmittedBy");

            migrationBuilder.CreateIndex(
                name: "IX_VesselVisitNotifications_VesselId",
                table: "VesselVisitNotifications",
                column: "VesselId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Containers");

            migrationBuilder.DropTable(
                name: "CrewMembers");

            migrationBuilder.DropTable(
                name: "DecisionLogEntries");

            migrationBuilder.DropTable(
                name: "Resources");

            migrationBuilder.DropTable(
                name: "VesselVisitNotifications");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "StorageAreas",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .Annotation("Sqlite:Autoincrement", true);

            migrationBuilder.CreateIndex(
                name: "IX_ShippingAgentRepresentatives_OrganizationId",
                table: "ShippingAgentRepresentatives",
                column: "OrganizationId");

            migrationBuilder.AddForeignKey(
                name: "FK_ShippingAgentRepresentatives_ShippingAgentOrganizations_OrganizationId",
                table: "ShippingAgentRepresentatives",
                column: "OrganizationId",
                principalTable: "ShippingAgentOrganizations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
