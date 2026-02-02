using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TourBooking.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserAndMultiTenancy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.DropIndex(
            //    name: "IX_Buses_VehicleNumber",
            //    table: "Buses");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Buses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Agreements",
                type: "int",
                nullable: true);

            migrationBuilder.Sql("DROP TABLE IF EXISTS Users");

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Buses_UserId_VehicleNumber",
                table: "Buses",
                columns: new[] { "UserId", "VehicleNumber" },
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Agreements_UserId",
                table: "Agreements",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Agreements_Users_UserId",
                table: "Agreements",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Buses_Users_UserId",
                table: "Buses",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Agreements_Users_UserId",
                table: "Agreements");

            migrationBuilder.DropForeignKey(
                name: "FK_Buses_Users_UserId",
                table: "Buses");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Buses_UserId_VehicleNumber",
                table: "Buses");

            migrationBuilder.DropIndex(
                name: "IX_Agreements_UserId",
                table: "Agreements");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Buses");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Agreements");

            migrationBuilder.CreateIndex(
                name: "IX_Buses_VehicleNumber",
                table: "Buses",
                column: "VehicleNumber",
                unique: true);
        }
    }
}
