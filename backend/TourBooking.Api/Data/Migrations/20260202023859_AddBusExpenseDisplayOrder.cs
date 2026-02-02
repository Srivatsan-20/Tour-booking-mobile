using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TourBooking.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBusExpenseDisplayOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "BusExpenses",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "BusExpenses");
        }
    }
}
