using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using TourBooking.Api.Data;
using TourBooking.Api.Models;

namespace TourBooking.Api.Services;

public interface IAuthService
{
    Task<string?> LoginAsync(string username, string password);
    Task<Tenant> RegisterTenantAsync(string tenantName, string adminUsername, string adminPassword);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<string?> LoginAsync(string username, string password)
    {
        // 1. Find user (TenantId irrelevant for finding user, but username must be unique globally? 
        // We set User.Username unique index, so yes.
        // We need to query WITHOUT query filters because if we haven't logged in yet, we don't have a TenantId!
        // So we MUST use IgnoreQueryFilters().
        
        var user = await _context.Users.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Username == username);

        if (user == null || !user.IsActive) return null;

        // 2. Verify password
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)) return null;

        // 3. Generate Token
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        if (user.TenantId.HasValue)
        {
            claims.Add(new Claim("tenantid", user.TenantId.Value.ToString()));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task<Tenant> RegisterTenantAsync(string tenantName, string adminUsername, string adminPassword)
    {
        // 1. Check if user exists
        if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == adminUsername))
        {
            throw new Exception("Username already taken.");
        }

        using var trans = await _context.Database.BeginTransactionAsync();
        try 
        {
            // 2. Create Tenant
            var tenant = new Tenant { Name = tenantName };
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            // 3. Create Admin User
            var user = new User
            {
                Username = adminUsername,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                Role = UserRole.TenantAdmin,
                TenantId = tenant.Id,
                FullName = "Admin"
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            await trans.CommitAsync();

            return tenant;
        }
        catch
        {
            await trans.RollbackAsync();
            throw;
        }
    }
}
