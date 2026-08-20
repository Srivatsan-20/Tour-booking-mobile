using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using TourBooking.Api.Data;
using TourBooking.Api.Services;
using TourBooking.Api.Models;
using System.IO;

// 1. Load .env file from execution or parent workspace directories on start
var currentDir = Directory.GetCurrentDirectory();
var envFilePath = Path.Combine(currentDir, ".env");
if (!File.Exists(envFilePath))
{
    var parentDir = Directory.GetParent(currentDir);
    if (parentDir != null)
    {
        envFilePath = Path.Combine(parentDir.FullName, ".env");
        if (!File.Exists(envFilePath))
        {
            var pParentDir = parentDir.Parent;
            if (pParentDir != null)
            {
                envFilePath = Path.Combine(pParentDir.FullName, ".env");
            }
        }
    }
}

if (File.Exists(envFilePath))
{
    foreach (var envLine in File.ReadAllLines(envFilePath))
    {
        if (string.IsNullOrWhiteSpace(envLine) || envLine.StartsWith("#")) continue;
        var separatorIdx = envLine.IndexOf('=');
        if (separatorIdx > 0)
        {
            var envKey = envLine.Substring(0, separatorIdx).Trim();
            var envVal = envLine.Substring(separatorIdx + 1).Trim();
            // Remove optional surrounding quotes
            if (envVal.StartsWith("\"") && envVal.EndsWith("\"")) envVal = envVal.Substring(1, envVal.Length - 2);
            if (envVal.StartsWith("'") && envVal.EndsWith("'")) envVal = envVal.Substring(1, envVal.Length - 2);
            
            System.Environment.SetEnvironmentVariable(envKey, envVal);
        }
    }
}

// 2. Map standard Razorpay key variables to ASP.NET Core double-underscore format (Razorpay:KeyId, Razorpay:KeySecret)
var standardKeyId = System.Environment.GetEnvironmentVariable("RAZORPAY_KEY_ID") ?? System.Environment.GetEnvironmentVariable("NEXT_PUBLIC_RAZORPAY_KEY_ID");
var standardKeySecret = System.Environment.GetEnvironmentVariable("RAZORPAY_KEY_SECRET");

if (!string.IsNullOrEmpty(standardKeyId))
{
    System.Environment.SetEnvironmentVariable("Razorpay__KeyId", standardKeyId);
}
if (!string.IsNullOrEmpty(standardKeySecret))
{
    System.Environment.SetEnvironmentVariable("Razorpay__KeySecret", standardKeySecret);
}

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
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(connectionString) && (connectionString.Contains("Server=") || connectionString.Contains("Database=")))
    {
        options.UseSqlServer(connectionString);
    }
    else
    {
        options.UseSqlite("Data Source=tourbooking.db");
    }
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
    if (db.Database.ProviderName == "Microsoft.EntityFrameworkCore.Sqlite")
    {
        db.Database.Migrate();
    }
    
    // Seed partner if not exists
    if (!db.Users.Any())
    {
        db.Users.Add(new User 
        { 
            Username = "admin",  // Or "partner" if you prefer
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"), 
            CompanyName = "Shreesai Senthil SaaS",
            DriverCharges = 500,
            TollCharges = 500,
            FastTagCharges = 200,
            OtherCharges = 0,
            Role = "SuperAdmin",
            SubscriptionStatus = "Active"
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
