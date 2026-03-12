using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using TourBooking.Api.Data;
using TourBooking.Api.Services;
using TourBooking.Api.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Tour Booking API", Version = "v1" });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlite("Data Source=tourbooking.db");
});

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IMessageService, MockMessageService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var keyStr = builder.Configuration["Jwt:Key"] ?? "super_secret_key_change_me_in_prod_12345_must_be_long_enough";
        var key = Encoding.UTF8.GetBytes(keyStr);

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CustomerOnly", p => p.RequireRole("customer"));
    options.AddPolicy("PartnerOnly",  p => p.RequireRole("partner"));
});


var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Tour Booking API V1");
    c.RoutePrefix = "swagger";
});

app.UseCors("DevCors");

app.UseDefaultFiles(); // Allow index.html etc
app.UseStaticFiles();  // Serve files from wwwroot

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    
    // Seed partner if not exists
    if (!db.Users.Any())
    {
        db.Users.Add(new User 
        { 
            Username = "partner", 
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("partner123"), 
            CompanyName = "Srisai Senthil Travels",
            DriverCharges = 500,
            TollCharges = 500,
            FastTagCharges = 200,
            OtherCharges = 0
        });
        db.SaveChanges();
    }
    
    // Seed buses if not exists
    if (!db.Buses.Any())
    {
        var partnerId = db.Users.First().Id;
        db.Buses.AddRange(new List<Bus> {
            new Bus { UserId = partnerId, VehicleNumber = "TN29AB4321", BusType = "AC", BaseRate = 8000, Capacity = 40, IsActive = true },
            new Bus { UserId = partnerId, VehicleNumber = "TN06AC3546", BusType = "NON-AC", BaseRate = 7000, Capacity = 50, IsActive = true },
            new Bus { UserId = partnerId, VehicleNumber = "TT2222", BusType = "AC", BaseRate = 8500, Capacity = 36, IsActive = true }
        });
        db.SaveChanges();
    }
}

app.Run();
