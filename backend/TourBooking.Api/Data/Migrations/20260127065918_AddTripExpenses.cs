using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TourBooking.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTripExpenses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TripExpenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AgreementId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
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
                name: "BusExpenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TripExpenseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DriverBatta = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    Days = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    StartKm = table.Column<int>(type: "int", nullable: true),
                    EndKm = table.Column<int>(type: "int", nullable: true)
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
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusExpenseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Place = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Liters = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    Cost = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m)
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
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BusExpenseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m)
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FuelEntries");

            migrationBuilder.DropTable(
                name: "OtherExpenses");

            migrationBuilder.DropTable(
                name: "BusExpenses");

            migrationBuilder.DropTable(
                name: "TripExpenses");
        }
    }
}
