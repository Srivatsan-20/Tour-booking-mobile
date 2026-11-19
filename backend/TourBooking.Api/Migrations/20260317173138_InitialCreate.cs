using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TourBooking.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CustomerUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Key = table.Column<string>(type: "TEXT", nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: false),
                    Group = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Key);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Username = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    CompanyName = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyAddress = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyPhone = table.Column<string>(type: "TEXT", nullable: false),
                    CompanyEmail = table.Column<string>(type: "TEXT", nullable: false),
                    UpiLink = table.Column<string>(type: "TEXT", nullable: true),
                    DriverCharges = table.Column<decimal>(type: "TEXT", nullable: false),
                    TollCharges = table.Column<decimal>(type: "TEXT", nullable: false),
                    FastTagCharges = table.Column<decimal>(type: "TEXT", nullable: false),
                    OtherCharges = table.Column<decimal>(type: "TEXT", nullable: false),
                    Role = table.Column<string>(type: "TEXT", nullable: false),
                    SubscriptionStatus = table.Column<string>(type: "TEXT", nullable: false),
                    SubscriptionValidUntil = table.Column<DateTime>(type: "TEXT", nullable: true),
                    AdminPayLink = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Agreements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: true),
                    CustomerUserId = table.Column<int>(type: "INTEGER", nullable: true),
                    CustomerName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    FromDate = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ToDate = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    BusType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    BusCount = table.Column<int>(type: "INTEGER", nullable: true),
                    Passengers = table.Column<int>(type: "INTEGER", nullable: true),
                    PlacesToCover = table.Column<string>(type: "TEXT", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "TEXT", nullable: true),
                    AdvancePaid = table.Column<decimal>(type: "TEXT", nullable: true),
                    Balance = table.Column<decimal>(type: "TEXT", nullable: true),
                    PerDayRent = table.Column<decimal>(type: "TEXT", nullable: true),
                    IncludeMountainRent = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    MountainRent = table.Column<decimal>(type: "TEXT", nullable: true),
                    UseIndividualBusRates = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    BusRatesJson = table.Column<string>(type: "TEXT", maxLength: 8000, nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    IsCancelled = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: false),
                    CancelledAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    IsCompleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Agreements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Agreements_CustomerUsers_CustomerUserId",
                        column: x => x.CustomerUserId,
                        principalTable: "CustomerUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Agreements_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Buses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: true),
                    VehicleNumber = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false, defaultValue: true),
                    BusType = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "AC"),
                    Capacity = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 40),
                    BaseRate = table.Column<decimal>(type: "TEXT", nullable: false, defaultValue: 5000m),
                    HomeCity = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Buses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Buses_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TripExpenses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    AgreementId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "GETUTCDATE()")
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
                    AgreementId = table.Column<Guid>(type: "TEXT", nullable: false),
                    BusId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false, defaultValueSql: "GETUTCDATE()")
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
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TripExpenseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    BusId = table.Column<Guid>(type: "TEXT", nullable: true),
                    DriverBatta = table.Column<decimal>(type: "decimal(18,2)", nullable: false, defaultValue: 0m),
                    Days = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0),
                    StartKm = table.Column<int>(type: "INTEGER", nullable: true),
                    EndKm = table.Column<int>(type: "INTEGER", nullable: true),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false, defaultValue: 0)
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
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    BusExpenseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Place = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
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
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    BusExpenseId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 400, nullable: false),
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
                name: "IX_AgreementBusAssignments_BusId",
                table: "AgreementBusAssignments",
                column: "BusId");

            migrationBuilder.CreateIndex(
                name: "IX_Agreements_CustomerUserId",
                table: "Agreements",
                column: "CustomerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Agreements_UserId",
                table: "Agreements",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Buses_UserId_VehicleNumber",
                table: "Buses",
                columns: new[] { "UserId", "VehicleNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BusExpenses_BusId",
                table: "BusExpenses",
                column: "BusId");

            migrationBuilder.CreateIndex(
                name: "IX_BusExpenses_TripExpenseId",
                table: "BusExpenses",
                column: "TripExpenseId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerUsers_Phone",
                table: "CustomerUsers",
                column: "Phone",
                unique: true);

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
                name: "SystemSettings");

            migrationBuilder.DropTable(
                name: "BusExpenses");

            migrationBuilder.DropTable(
                name: "Buses");

            migrationBuilder.DropTable(
                name: "TripExpenses");

            migrationBuilder.DropTable(
                name: "Agreements");

            migrationBuilder.DropTable(
                name: "CustomerUsers");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
