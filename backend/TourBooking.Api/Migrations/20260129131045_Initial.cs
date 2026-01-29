using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TourBooking.Api.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tenants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Agreements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    CustomerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FromDate = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ToDate = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    BusType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    BusCount = table.Column<int>(type: "integer", nullable: true),
                    Passengers = table.Column<int>(type: "integer", nullable: true),
                    PlacesToCover = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AdvancePaid = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Balance = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    PerDayRent = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    IncludeMountainRent = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    MountainRent = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    UseIndividualBusRates = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    BusRatesJson = table.Column<string>(type: "text", maxLength: 8000, nullable: true),
                    Notes = table.Column<string>(type: "text", maxLength: 4000, nullable: false),
                    IsCancelled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CancelledAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Agreements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Agreements_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Buses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    VehicleNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Buses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Buses_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    FullName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    TenantId = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TripExpenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AgreementId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripExpenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TripExpenses_Agreements_AgreementId",
                        column: x => x.AgreementId,
                        principalTable: "Agreements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AgreementBusAssignments",
                columns: table => new
                {
                    AgreementId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgreementBusAssignments", x => new { x.AgreementId, x.BusId });
                    table.ForeignKey(
                        name: "FK_AgreementBusAssignments_Agreements_AgreementId",
                        column: x => x.AgreementId,
                        principalTable: "Agreements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AgreementBusAssignments_Buses_BusId",
                        column: x => x.BusId,
                        principalTable: "Buses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BusExpenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TripExpenseId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusId = table.Column<Guid>(type: "uuid", nullable: true),
                    DriverBatta = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                    Days = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    StartKm = table.Column<int>(type: "integer", nullable: true),
                    EndKm = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusExpenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusExpenses_Buses_BusId",
                        column: x => x.BusId,
                        principalTable: "Buses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BusExpenses_TripExpenses_TripExpenseId",
                        column: x => x.TripExpenseId,
                        principalTable: "TripExpenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FuelEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusExpenseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Place = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Liters = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m),
                    Cost = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FuelEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FuelEntries_BusExpenses_BusExpenseId",
                        column: x => x.BusExpenseId,
                        principalTable: "BusExpenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OtherExpenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusExpenseId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false, defaultValue: 0m)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OtherExpenses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OtherExpenses_BusExpenses_BusExpenseId",
                        column: x => x.BusExpenseId,
                        principalTable: "BusExpenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AgreementBusAssignments_BusId",
                table: "AgreementBusAssignments",
                column: "BusId");

            migrationBuilder.CreateIndex(
                name: "IX_Agreements_TenantId",
                table: "Agreements",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Buses_TenantId_VehicleNumber",
                table: "Buses",
                columns: new[] { "TenantId", "VehicleNumber" },
                unique: true,
                filter: "[TenantId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_BusExpenses_BusId",
                table: "BusExpenses",
                column: "BusId");

            migrationBuilder.CreateIndex(
                name: "IX_BusExpenses_TripExpenseId",
                table: "BusExpenses",
                column: "TripExpenseId");

            migrationBuilder.CreateIndex(
                name: "IX_FuelEntries_BusExpenseId",
                table: "FuelEntries",
                column: "BusExpenseId");

            migrationBuilder.CreateIndex(
                name: "IX_OtherExpenses_BusExpenseId",
                table: "OtherExpenses",
                column: "BusExpenseId");

            migrationBuilder.CreateIndex(
                name: "IX_TripExpenses_AgreementId",
                table: "TripExpenses",
                column: "AgreementId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId",
                table: "Users",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AgreementBusAssignments");

            migrationBuilder.DropTable(
                name: "FuelEntries");

            migrationBuilder.DropTable(
                name: "OtherExpenses");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "BusExpenses");

            migrationBuilder.DropTable(
                name: "Buses");

            migrationBuilder.DropTable(
                name: "TripExpenses");

            migrationBuilder.DropTable(
                name: "Agreements");

            migrationBuilder.DropTable(
                name: "Tenants");
        }
    }
}
