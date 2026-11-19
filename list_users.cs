using Microsoft.EntityFrameworkCore;
using TourBooking.Api.Data;
using TourBooking.Api.Models;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = "Server=localhost,1433;Database=TourBooking;User Id=sa;Password=TourBooking@123;TrustServerCertificate=True;MultipleActiveResultSets=True";
    options.UseSqlServer(connectionString);
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var users = await db.Users.Select(u => new { u.Username, u.Email }).ToListAsync();
    Console.WriteLine(JsonSerializer.Serialize(users, new JsonSerializerOptions { WriteIndented = true }));
}
