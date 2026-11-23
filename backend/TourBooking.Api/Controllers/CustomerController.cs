using System.Security.Claims;
using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using TourBooking.Api.Data;
using TourBooking.Api.Models;
using TourBooking.Api.Services;
using TourBooking.Api.Contracts;

namespace TourBooking.Api.Controllers;

[ApiController]
[Route("api/customer")]
public sealed class CustomerController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokens;
    private readonly IMessageService _messages;

    public CustomerController(AppDbContext db, ITokenService tokens, IMessageService messages)
    {
        _db = db;
        _tokens = tokens;
        _messages = messages;
    }

    // ─── Auth ──────────────────────────────────────────────────────────────────

    [HttpPost("register")]
    public async Task<ActionResult<CustomerAuthResponse>> Register(
        [FromBody] CustomerRegisterDto dto, CancellationToken ct)
    {
        dto.Phone = dto.Phone?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(dto.Phone))
            return BadRequest("Phone number is required.");

        if (await _db.CustomerUsers.AnyAsync(c => c.Phone == dto.Phone, ct))
            return BadRequest("An account with this phone number already exists.");

        var customer = new CustomerUser
        {
            Name         = dto.Name.Trim(),
            Phone        = dto.Phone,
            Email        = dto.Email?.Trim() ?? string.Empty,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.CustomerUsers.Add(customer);
        await _db.SaveChangesAsync(ct);

        return Ok(BuildResponse(customer));
    }

    [HttpPost("login")]
    public async Task<ActionResult<CustomerAuthResponse>> Login(
        [FromBody] CustomerLoginDto dto, CancellationToken ct)
    {
        var phone = dto.Phone?.Trim() ?? string.Empty;
        var customer = await _db.CustomerUsers.FirstOrDefaultAsync(c => c.Phone == phone, ct);

        if (customer == null || !BCrypt.Net.BCrypt.Verify(dto.Password, customer.PasswordHash))
            return Unauthorized("Invalid phone number or password.");

        return Ok(BuildResponse(customer));
    }

    [HttpDelete("account")]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<IActionResult> DeleteAccount(CancellationToken ct)
    {
        var customerId = GetCustomerId();
        if (customerId == null) return Unauthorized();

        var customer = await _db.CustomerUsers.FirstOrDefaultAsync(c => c.Id == customerId, ct);
        if (customer == null) return NotFound("Account not found.");

        var agreements = await _db.Agreements.Where(a => a.CustomerUserId == customerId).ToListAsync(ct);
        foreach (var a in agreements)
        {
            a.CustomerUserId = null;
        }

        _db.CustomerUsers.Remove(customer);
        await _db.SaveChangesAsync(ct);

        return Ok(new { message = "Account successfully deleted." });
    }

    // ─── My Bookings ───────────────────────────────────────────────────────────

    [HttpGet("my-bookings")]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<ActionResult<List<CustomerBookingDto>>> MyBookings(CancellationToken ct)
    {
        var customerId = GetCustomerId();
        if (customerId == null) return Unauthorized();

        var agreements = await _db.Agreements
            .AsNoTracking()
            .Include(a => a.User)
            .Include(a => a.BusAssignments).ThenInclude(x => x.Bus)
            .Where(a => a.CustomerUserId == customerId && !a.IsCancelled)
            .OrderByDescending(a => a.CreatedAtUtc)
            .ToListAsync(ct);

        return Ok(agreements.Select(MapToDto).ToList());
    }

    [HttpGet("my-bookings/{id:guid}")]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<ActionResult<CustomerBookingDto>> GetBooking(Guid id, CancellationToken ct)
    {
        var customerId = GetCustomerId();
        if (customerId == null) return Unauthorized();

        var agreement = await _db.Agreements
            .AsNoTracking()
            .Include(a => a.User)
            .Include(a => a.BusAssignments).ThenInclude(x => x.Bus)
            .FirstOrDefaultAsync(a => a.Id == id && a.CustomerUserId == customerId, ct);

        if (agreement == null) return NotFound();

        return Ok(MapToDto(agreement));
    }

    [HttpGet("my-bookings/{id:guid}/agreement-data")]
    [Authorize(Policy = "CustomerOnly")]
    public async Task<ActionResult<AgreementResponse>> GetBookingAgreementData(Guid id, CancellationToken ct)
    {
        var customerId = GetCustomerId();
        if (customerId == null) return Unauthorized();

        var entity = await _db.Agreements
            .AsNoTracking()
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id && a.CustomerUserId == customerId, ct);

        if (entity == null) return NotFound();

        return Ok(new AgreementResponse {
            Id = entity.Id,
            CustomerName = entity.CustomerName,
            Phone = entity.Phone,
            FromDate = entity.FromDate,
            ToDate = entity.ToDate,
            BusType = entity.BusType,
            BusCount = entity.BusCount,
            Passengers = entity.Passengers,
            PlacesToCover = entity.PlacesToCover,
            PerDayRent = entity.PerDayRent,
            IncludeMountainRent = entity.IncludeMountainRent,
            MountainRent = entity.MountainRent,
            TotalAmount = entity.TotalAmount,
            AdvancePaid = entity.AdvancePaid,
            Balance = entity.Balance,
            Notes = entity.Notes,
            IsCancelled = entity.IsCancelled,
            CreatedAtUtc = entity.CreatedAtUtc,
            CompanyName = entity.User?.CompanyName,
            CompanyAddress = entity.User?.CompanyAddress,
            CompanyPhone = entity.User?.CompanyPhone
        });
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private int? GetCustomerId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    private CustomerAuthResponse BuildResponse(CustomerUser c)
    {
        var token = _tokens.CreateCustomerToken(c);
        return new CustomerAuthResponse
        {
            Id    = c.Id,
            Name  = c.Name,
            Phone = c.Phone,
            Email = c.Email,
            Token = token
        };
    }

    private static CustomerBookingDto MapToDto(Agreement a)
    {
        var bus = a.BusAssignments.FirstOrDefault()?.Bus;
        return new CustomerBookingDto
        {
            Id             = a.Id,
            CustomerName   = a.CustomerName,
            Phone          = a.Phone,
            FromDate       = a.FromDate,
            ToDate         = a.ToDate,
            PlacesToCover  = a.PlacesToCover,
            BusType        = a.BusType,
            TotalAmount    = a.TotalAmount,
            AdvancePaid    = a.AdvancePaid,
            Balance        = a.Balance,
            PerDayRent     = a.PerDayRent,
            Notes          = a.Notes,
            IsCancelled    = a.IsCancelled,
            IsCompleted    = a.IsCompleted,
            CreatedAtUtc   = a.CreatedAtUtc,
            VehicleNumber  = bus?.VehicleNumber,
            BusName        = bus?.Name,
            CompanyName    = a.User?.CompanyName
        };
    }
}

// ─── DTOs ──────────────────────────────────────────────────────────────────────

public class CustomerRegisterDto
{
    public required string Name     { get; set; }
    public required string Phone    { get; set; }
    public string? Email            { get; set; }
    public required string Password { get; set; }
}

public class CustomerLoginDto
{
    public required string Phone    { get; set; }
    public required string Password { get; set; }
}

public class CustomerAuthResponse
{
    public int    Id    { get; set; }
    public string Name  { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
}

public class CustomerBookingDto
{
    public Guid    Id            { get; set; }
    public string  CustomerName  { get; set; } = string.Empty;
    public string  Phone         { get; set; } = string.Empty;
    public string  FromDate      { get; set; } = string.Empty;
    public string  ToDate        { get; set; } = string.Empty;
    public string  PlacesToCover { get; set; } = string.Empty;
    public string  BusType       { get; set; } = string.Empty;
    public decimal? TotalAmount  { get; set; }
    public decimal? AdvancePaid  { get; set; }
    public decimal? Balance      { get; set; }
    public decimal? PerDayRent   { get; set; }
    public string  Notes         { get; set; } = string.Empty;
    public bool    IsCancelled   { get; set; }
    public bool    IsCompleted   { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public string?  VehicleNumber { get; set; }
    public string?  BusName      { get; set; }
    public string?  CompanyName  { get; set; }
}
