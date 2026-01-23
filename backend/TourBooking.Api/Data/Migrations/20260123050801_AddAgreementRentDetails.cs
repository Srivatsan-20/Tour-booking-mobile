using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TourBooking.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAgreementRentDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BusRatesJson",
                table: "Agreements",
                type: "nvarchar(max)",
                maxLength: 8000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IncludeMountainRent",
                table: "Agreements",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "MountainRent",
                table: "Agreements",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PerDayRent",
                table: "Agreements",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "UseIndividualBusRates",
                table: "Agreements",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BusRatesJson",
                table: "Agreements");

            migrationBuilder.DropColumn(
                name: "IncludeMountainRent",
                table: "Agreements");

            migrationBuilder.DropColumn(
                name: "MountainRent",
                table: "Agreements");

            migrationBuilder.DropColumn(
                name: "PerDayRent",
                table: "Agreements");

            migrationBuilder.DropColumn(
                name: "UseIndividualBusRates",
                table: "Agreements");
        }
    }
}
