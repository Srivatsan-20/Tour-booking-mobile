using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TourBooking.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UpiLink",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BaseRate",
                table: "Buses",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 5000m);

            migrationBuilder.AddColumn<string>(
                name: "BusType",
                table: "Buses",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "AC");

            migrationBuilder.AddColumn<int>(
                name: "Capacity",
                table: "Buses",
                type: "int",
                nullable: false,
                defaultValue: 40);

            migrationBuilder.AddColumn<string>(
                name: "HomeCity",
                table: "Buses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CustomerUserId",
                table: "Agreements",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CustomerUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Key = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Group = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Key);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Agreements_CustomerUserId",
                table: "Agreements",
                column: "CustomerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerUsers_Phone",
                table: "CustomerUsers",
                column: "Phone",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Agreements_CustomerUsers_CustomerUserId",
                table: "Agreements",
                column: "CustomerUserId",
                principalTable: "CustomerUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Agreements_CustomerUsers_CustomerUserId",
                table: "Agreements");

            migrationBuilder.DropTable(
                name: "CustomerUsers");

            migrationBuilder.DropTable(
                name: "SystemSettings");

            migrationBuilder.DropIndex(
                name: "IX_Agreements_CustomerUserId",
                table: "Agreements");

            migrationBuilder.DropColumn(
                name: "UpiLink",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BaseRate",
                table: "Buses");

            migrationBuilder.DropColumn(
                name: "BusType",
                table: "Buses");

            migrationBuilder.DropColumn(
                name: "Capacity",
                table: "Buses");

            migrationBuilder.DropColumn(
                name: "HomeCity",
                table: "Buses");

            migrationBuilder.DropColumn(
                name: "CustomerUserId",
                table: "Agreements");
        }
    }
}
