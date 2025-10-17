using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortProject.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Docks",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    DockName = table.Column<string>(type: "TEXT", nullable: false),
                    LocationZone = table.Column<string>(type: "TEXT", nullable: false),
                    LocationSection = table.Column<string>(type: "TEXT", nullable: false),
                    Length = table.Column<double>(type: "REAL", nullable: false),
                    Depth = table.Column<double>(type: "REAL", nullable: false),
                    MaxDraft = table.Column<double>(type: "REAL", nullable: false),
                    NumberOfSTSCranes = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Docks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Qualifications",
                columns: table => new
                {
                    Code = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Qualifications", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "ShippingAgentOrganizations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    LegalName = table.Column<string>(type: "TEXT", nullable: false),
                    AlternativeName = table.Column<string>(type: "TEXT", nullable: true),
                    Address_Street = table.Column<string>(type: "TEXT", nullable: true),
                    Address_City = table.Column<string>(type: "TEXT", nullable: true),
                    Address_Country = table.Column<string>(type: "TEXT", nullable: true),
                    TaxNumber = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShippingAgentOrganizations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StaffMembers",
                columns: table => new
                {
                    MecanographicNumber = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ShortName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    Phone = table.Column<string>(type: "TEXT", nullable: false),
                    OperationalWindow_StartTime = table.Column<TimeSpan>(type: "TEXT", nullable: false),
                    OperationalWindow_EndTime = table.Column<TimeSpan>(type: "TEXT", nullable: false),
                    OperationalWindow_WorkingDays = table.Column<string>(type: "TEXT", nullable: false),
                    CurrentStatus = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffMembers", x => x.MecanographicNumber);
                });

            migrationBuilder.CreateTable(
                name: "StorageAreas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false),
                    X = table.Column<float>(type: "REAL", nullable: false),
                    Y = table.Column<float>(type: "REAL", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: false),
                    Capacity = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StorageAreas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VesselTypes",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Capacity = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxRows = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxBays = table.Column<int>(type: "INTEGER", nullable: false),
                    MaxTiers = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VesselTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DockAllowedVesselTypes",
                columns: table => new
                {
                    VesselTypeId = table.Column<string>(type: "TEXT", nullable: false),
                    DockId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DockAllowedVesselTypes", x => new { x.DockId, x.VesselTypeId });
                    table.ForeignKey(
                        name: "FK_DockAllowedVesselTypes_Docks_DockId",
                        column: x => x.DockId,
                        principalTable: "Docks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShippingAgentRepresentatives",
                columns: table => new
                {
                    RepresentativeId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CitizenId = table.Column<string>(type: "TEXT", nullable: false),
                    RepresentativeName = table.Column<string>(type: "TEXT", nullable: false),
                    RepresentativeEmail = table.Column<string>(type: "TEXT", nullable: false),
                    RepresentativePhone = table.Column<string>(type: "TEXT", nullable: false),
                    RepresentativeNationality = table.Column<string>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShippingAgentRepresentatives", x => x.RepresentativeId);
                    table.ForeignKey(
                        name: "FK_ShippingAgentRepresentatives_ShippingAgentOrganizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "ShippingAgentOrganizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StaffMemberQualification",
                columns: table => new
                {
                    QualificationsCode = table.Column<string>(type: "TEXT", nullable: false),
                    StaffMemberMecanographicNumber = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffMemberQualification", x => new { x.QualificationsCode, x.StaffMemberMecanographicNumber });
                    table.ForeignKey(
                        name: "FK_StaffMemberQualification_Qualifications_QualificationsCode",
                        column: x => x.QualificationsCode,
                        principalTable: "Qualifications",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StaffMemberQualification_StaffMembers_StaffMemberMecanographicNumber",
                        column: x => x.StaffMemberMecanographicNumber,
                        principalTable: "StaffMembers",
                        principalColumn: "MecanographicNumber",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Vessels",
                columns: table => new
                {
                    IMO = table.Column<string>(type: "TEXT", maxLength: 7, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    VesselTypeId = table.Column<string>(type: "TEXT", nullable: false),
                    OperatorName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vessels", x => x.IMO);
                    table.ForeignKey(
                        name: "FK_Vessels_VesselTypes_VesselTypeId",
                        column: x => x.VesselTypeId,
                        principalTable: "VesselTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShippingAgentRepresentatives_OrganizationId",
                table: "ShippingAgentRepresentatives",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffMemberQualification_StaffMemberMecanographicNumber",
                table: "StaffMemberQualification",
                column: "StaffMemberMecanographicNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Vessels_VesselTypeId",
                table: "Vessels",
                column: "VesselTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_VesselTypes_Name",
                table: "VesselTypes",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DockAllowedVesselTypes");

            migrationBuilder.DropTable(
                name: "ShippingAgentRepresentatives");

            migrationBuilder.DropTable(
                name: "StaffMemberQualification");

            migrationBuilder.DropTable(
                name: "StorageAreas");

            migrationBuilder.DropTable(
                name: "Vessels");

            migrationBuilder.DropTable(
                name: "Docks");

            migrationBuilder.DropTable(
                name: "ShippingAgentOrganizations");

            migrationBuilder.DropTable(
                name: "Qualifications");

            migrationBuilder.DropTable(
                name: "StaffMembers");

            migrationBuilder.DropTable(
                name: "VesselTypes");
        }
    }
}
