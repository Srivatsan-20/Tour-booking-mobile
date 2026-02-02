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

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            CompanyName = dto.CompanyName,
            CompanyAddress = dto.CompanyAddress,
            CompanyPhone = dto.CompanyPhone,
            CompanyEmail = dto.Email // Default company email to user email if not separate
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _tokenService.CreateToken(user);
        return new AuthResponse { Username = user.Username, Token = token, UserId = user.Id, CompanyName = user.CompanyName, CompanyAddress = user.CompanyAddress, CompanyPhone = user.CompanyPhone };
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

        var token = _tokenService.CreateToken(user);
        return new AuthResponse { Username = user.Username, Token = token, UserId = user.Id, CompanyName = user.CompanyName, CompanyAddress = user.CompanyAddress, CompanyPhone = user.CompanyPhone };
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

        await _context.SaveChangesAsync();

        // Return updated auth response (token remains valid usually, but we return fresh user data)
        // Note: functionality to change username/password is not included here for simplicity
        var token = _tokenService.CreateToken(user); // Generating new token to encode upto date claims if any changed
        
        return new AuthResponse { 
            Username = user.Username, 
            Token = token, 
            UserId = user.Id, 
            CompanyName = user.CompanyName, 
            CompanyAddress = user.CompanyAddress, 
            CompanyPhone = user.CompanyPhone,
            Email = user.Email
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
}
