using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TourBooking.Api.Data;
using TourBooking.Api.Models;
using TourBooking.Api.Services;

namespace TourBooking.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthController(AppDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
        {
            return BadRequest("Username already exists.");
        }

        bool isFirstUser = !await _context.Users.AnyAsync();

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            CompanyName = dto.CompanyName,
            CompanyAddress = dto.CompanyAddress,
            CompanyPhone = dto.CompanyPhone,
            CompanyEmail = dto.Email, // Default company email to user email if not separate
            Role = isFirstUser ? "SuperAdmin" : "Partner",
            SubscriptionStatus = isFirstUser ? "Active" : "Pending",
            SubscriptionValidUntil = DateTime.UtcNow.AddDays(30)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        
        var superAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Role == "SuperAdmin");

        var token = _tokenService.CreateToken(user);
        return new AuthResponse { 
            Username = user.Username, 
            Token = token, 
            UserId = user.Id, 
            CompanyName = user.CompanyName, 
            CompanyAddress = user.CompanyAddress, 
            CompanyPhone = user.CompanyPhone,
            Role = user.Role,
            SubscriptionStatus = user.SubscriptionStatus,
            SubscriptionValidUntil = user.SubscriptionValidUntil,
            AdminPayLink = user.AdminPayLink,
            SystemPayLink = superAdmin?.AdminPayLink
        };
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
        if (user == null) return Unauthorized("Invalid username or password.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Unauthorized("Invalid username or password.");
        }

        var superAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Role == "SuperAdmin");

        var token = _tokenService.CreateToken(user);
        return new AuthResponse { 
            Username = user.Username, 
            Token = token, 
            UserId = user.Id, 
            CompanyName = user.CompanyName, 
            CompanyAddress = user.CompanyAddress, 
            CompanyPhone = user.CompanyPhone,
            Email = user.Email,
            UpiLink = user.UpiLink,
            DriverCharges = user.DriverCharges,
            TollCharges = user.TollCharges,
            FastTagCharges = user.FastTagCharges,
            OtherCharges = user.OtherCharges,
            Role = user.Role,
            SubscriptionStatus = user.SubscriptionStatus,
            SubscriptionValidUntil = user.SubscriptionValidUntil,
            AdminPayLink = user.AdminPayLink,
            SystemPayLink = superAdmin?.AdminPayLink
        };
    }
    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> UpdateProfile(UpdateProfileDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound("User not found.");

        // Update fields
        user.CompanyName = dto.CompanyName;
        user.CompanyAddress = dto.CompanyAddress;
        user.CompanyPhone = dto.CompanyPhone;
        
        // Only update email if provided and different (might need validation logic here ideally)
        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
             user.Email = dto.Email;
             user.CompanyEmail = dto.Email; // Syncing for now as per design
        }

        user.UpiLink = dto.UpiLink;
        user.DriverCharges = dto.DriverCharges;
        user.TollCharges = dto.TollCharges;
        user.FastTagCharges = dto.FastTagCharges;
        user.OtherCharges = dto.OtherCharges;
        if (user.Role == "SuperAdmin" && dto.AdminPayLink != null) 
        {
            user.AdminPayLink = dto.AdminPayLink;
        }

        await _context.SaveChangesAsync();

        // Return updated auth response (token remains valid usually, but we return fresh user data)
        // Note: functionality to change username/password is not included here for simplicity
        var token = _tokenService.CreateToken(user); // Generating new token to encode upto date claims if any changed
        
        var superAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Role == "SuperAdmin");

        return new AuthResponse { 
            Username = user.Username, 
            Token = token, 
            UserId = user.Id, 
            CompanyName = user.CompanyName, 
            CompanyAddress = user.CompanyAddress, 
            CompanyPhone = user.CompanyPhone,
            Email = user.Email,
            UpiLink = user.UpiLink,
            DriverCharges = user.DriverCharges,
            TollCharges = user.TollCharges,
            FastTagCharges = user.FastTagCharges,
            OtherCharges = user.OtherCharges,
            Role = user.Role,
            SubscriptionStatus = user.SubscriptionStatus,
            SubscriptionValidUntil = user.SubscriptionValidUntil,
            AdminPayLink = user.AdminPayLink,
            SystemPayLink = superAdmin?.AdminPayLink
        };
    }
}

public class RegisterDto
{
    public required string Username { get; set; }
    public required string Password { get; set; }
    public string Email { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string CompanyAddress { get; set; } = string.Empty;
    public string CompanyPhone { get; set; } = string.Empty;
}

public class LoginDto
{
    public required string Username { get; set; }
    public required string Password { get; set; }
}
public class UpdateProfileDto
{
    public string CompanyName { get; set; } = string.Empty;
    public string CompanyAddress { get; set; } = string.Empty;
    public string CompanyPhone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? UpiLink { get; set; }
    public decimal DriverCharges { get; set; }
    public decimal TollCharges { get; set; }
    public decimal FastTagCharges { get; set; }
    public decimal OtherCharges { get; set; }
    public string? AdminPayLink { get; set; }
}

public class AuthResponse
{
    public string Username { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string CompanyAddress { get; set; } = string.Empty;
    public string CompanyPhone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? UpiLink { get; set; }
    public decimal DriverCharges { get; set; }
    public decimal TollCharges { get; set; }
    public decimal FastTagCharges { get; set; }
    public decimal OtherCharges { get; set; }
    public string Role { get; set; } = string.Empty;
    public string SubscriptionStatus { get; set; } = string.Empty;
    public DateTime? SubscriptionValidUntil { get; set; }
    public string? AdminPayLink { get; set; }
    public string? SystemPayLink { get; set; } // Pay link of SuperAdmin for others to pay
}
