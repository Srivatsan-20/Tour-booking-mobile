using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using TourBooking.Api.Data;
using TourBooking.Api.Models;
using TourBooking.Api.Services;
using TourBooking.Api.Contracts;

namespace TourBooking.Api.Controllers;

[ApiController]
[Route("api/public")]
public sealed class PublicBookingController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMessageService _messages;

    public PublicBookingController(AppDbContext db, IMessageService messages)
    {
        _db = db;
        _messages = messages;
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<PublicBusDto>>> Search(
        [FromQuery] string fromDate,
        [FromQuery] string toDate,
        [FromQuery] string? city,
        [FromQuery] string? type,
        CancellationToken cancellationToken)
    {
        if (!TryParseIsoDate(fromDate, out var fDate) || !TryParseIsoDate(toDate, out var tDate))
        {
            return BadRequest("Dates must be yyyy-MM-dd");
        }

        if (tDate < fDate) return BadRequest("End date must be after start date");

        // 1. Get ALL active buses in the system, including their owner (User) details
        var allBuses = await _db.Buses
            .AsNoTracking()
            .Include(b => b.User)
            .Where(b => b.IsActive)
            .ToListAsync(cancellationToken);

        // 2. Get ALL non-cancelled agreements that could potentially overlap
        var activeAgreements = await _db.Agreements
            .AsNoTracking()
            .Where(a => !a.IsCancelled)
            .ToListAsync(cancellationToken);

        // 3. Find IDs of buses that are busy
        var busyBusIds = new HashSet<Guid>();

        // Fetch all assignments for active agreements to check overlaps
        var agreementIds = activeAgreements.Select(a => a.Id).ToList();
        var assignments = await _db.AgreementBusAssignments
            .AsNoTracking()
            .Where(x => agreementIds.Contains(x.AgreementId))
            .ToListAsync(cancellationToken);

        foreach (var agreement in activeAgreements)
        {
             if (!TryParseDate(agreement.FromDate, out var aFrom) || !TryParseDate(agreement.ToDate, out var aTo))
                continue;

             // Check for direct overlap without buffer to match user expectation
             if (fDate <= aTo && tDate >= aFrom)
             {
                 // This agreement (with buffer) overlaps the requested period.
                 // Mark its assigned buses as busy.
                 var linkedBuses = assignments.Where(x => x.AgreementId == agreement.Id).Select(x => x.BusId);
                 foreach(var bid in linkedBuses) busyBusIds.Add(bid);
             }
        }

        // 4. Filter available buses by City and Type, and map to DTO
        var availableBuses = allBuses
            .Where(b => !busyBusIds.Contains(b.Id))
            .Where(b => string.IsNullOrWhiteSpace(city) || b.HomeCity == null || b.HomeCity.Contains(city, StringComparison.OrdinalIgnoreCase))
            .Where(b => string.IsNullOrWhiteSpace(type) || (b.BusType != null && b.BusType.Equals(type, StringComparison.OrdinalIgnoreCase)))
            .Select(b => new PublicBusDto
            {
                Id = b.Id,
                Name = b.Name ?? b.VehicleNumber,
                VehicleNumber = b.VehicleNumber,
                CompanyName = b.User?.CompanyName ?? "S3T Heritage Partner",
                BaseRate = b.BaseRate,
                BusType = b.BusType,
                Capacity = b.Capacity,
                DriverCharges = b.User?.DriverCharges ?? 500,
                TollCharges = b.User?.TollCharges ?? 0,
                FastTagCharges = b.User?.FastTagCharges ?? 0,
                OtherCharges = b.User?.OtherCharges ?? 0
            })
            .ToList();

        return Ok(availableBuses);
    }

    [HttpGet("bus/{id:guid}")]
    public async Task<ActionResult<PublicBusDto>> GetBus(Guid id, CancellationToken cancellationToken)
    {
        var bus = await _db.Buses
            .AsNoTracking()
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.Id == id && b.IsActive, cancellationToken);

        if (bus == null) return NotFound();

        return Ok(new PublicBusDto
        {
            Id = bus.Id,
            Name = bus.Name ?? bus.VehicleNumber,
            VehicleNumber = bus.VehicleNumber,
            CompanyName = bus.User?.CompanyName ?? "S3T Heritage Partner",
            BaseRate = bus.BaseRate,
            BusType = bus.BusType,
            Capacity = bus.Capacity,
            UpiLink = bus.User?.UpiLink,
            DriverCharges = bus.User?.DriverCharges ?? 500,
            TollCharges = bus.User?.TollCharges ?? 0,
            FastTagCharges = bus.User?.FastTagCharges ?? 0,
            OtherCharges = bus.User?.OtherCharges ?? 0
        });
    }

    [HttpGet("agreement/{id:guid}")]
    public async Task<ActionResult<AgreementResponse>> GetPublicAgreement(Guid id, CancellationToken cancellationToken)
    {
        var entity = await _db.Agreements
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity is null) return NotFound();

        // Convert to response (ToResponse logic equivalent)
        // We reuse the ToResponse if we can, but it is in AgreementsController.
        // For simplicity, let's just map it here.
        return Ok(new AgreementResponse
        {
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
            CreatedAtUtc = entity.CreatedAtUtc
        });
    }

    [HttpPost("book")]
    public async Task<ActionResult> Book([FromBody] PublicBookingRequest request, CancellationToken cancellationToken)
    {
        // 1. Find the bus to identify which partner (User) owns it
        if (request.BusId == null) return BadRequest("Bus selection is required for booking");

        var bus = await _db.Buses
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == request.BusId.Value, cancellationToken);

        if (bus == null) return BadRequest("Selected vehicle no longer available");

        var userId = bus.UserId;

        // Validate dates
        if (!TryParseIsoDate(request.FromDate, out var fromDate) || !TryParseIsoDate(request.ToDate, out var toDate))
             return BadRequest("Invalid dates");

        if (toDate < fromDate) return BadRequest("Return date must be after departure date");

        // ── SECURITY: Calculate price server-side from bus.BaseRate ──────────
        var days = (toDate.ToDateTime(TimeOnly.MinValue) - fromDate.ToDateTime(TimeOnly.MinValue)).Days + 1;
        var perDayRent  = bus.BaseRate;                        // locked from partner config
        var totalAmount = perDayRent * days;
        // ─────────────────────────────────────────────────────────────────────

        // Check if caller is a logged-in customer (optional — guest booking still allowed)
        int? customerUserId = null;
        var customerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var customerRole    = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (customerRole == "customer" && int.TryParse(customerIdClaim, out var cid))
            customerUserId = cid;

        // Create Agreement
        var agreement = new Agreement
        {
            UserId           = userId,
            CustomerUserId   = customerUserId,
            CustomerName     = request.CustomerName,
            Phone            = request.Phone,
            FromDate         = fromDate.ToString("dd/MM/yyyy"),
            ToDate           = toDate.ToString("dd/MM/yyyy"),
            BusType          = bus.BusType ?? "AC",
            BusCount         = 1,
            Passengers       = request.Passengers,
            PlacesToCover    = request.PlacesToCover,
            PerDayRent       = perDayRent,           // ← server-side value
            MountainRent     = 0,
            IncludeMountainRent = false,
            TotalAmount      = totalAmount,          // ← server-side value
            AdvancePaid      = totalAmount,          // full payment assumed online
            Balance          = 0,
            IsCancelled      = false,
            IsCompleted      = false,
            CreatedAtUtc     = DateTime.UtcNow,
            Notes            = "Online Booking - Payment ID: " + (request.PaymentId ?? "N/A")
        };

        _db.Agreements.Add(agreement);
        await _db.SaveChangesAsync(cancellationToken);

        // Assign the Bus
        _db.AgreementBusAssignments.Add(new AgreementBusAssignment
        {
            AgreementId  = agreement.Id,
            BusId        = request.BusId.Value,
            CreatedAtUtc = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(cancellationToken);

        // Send Confirmation
        _ = _messages.SendBookingConfirmation(
            request.Phone,
            request.CustomerName,
            bus.Name ?? bus.VehicleNumber,
            agreement.FromDate,
            agreement.ToDate,
            agreement.TotalAmount
        );

        return Ok(new
        {
            AgreementId = agreement.Id,
            Status      = "Confirmed",
            TotalAmount = totalAmount,      // return confirmed amount to client
            Days        = days,
            PerDayRent  = perDayRent
        });
    }


    // --- Helpers ---
    private static bool TryParseIsoDate(string input, out DateOnly date)
        => DateOnly.TryParseExact(input?.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);

    private static bool TryParseDate(string input, out DateOnly date)
    {
        var s = (input ?? string.Empty).Trim();
        var formats = new[] { "dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "yyyy-M-d", "MM/dd/yyyy", "M/d/yyyy" };
        // Clean up common issues if any
        return DateOnly.TryParseExact(s, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out date) ||
               DateOnly.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
    }
}

public class PublicBusDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string VehicleNumber { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public decimal BaseRate { get; set; }
    public string BusType { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string? UpiLink { get; set; }
    public decimal DriverCharges { get; set; }
    public decimal TollCharges { get; set; }
    public decimal FastTagCharges { get; set; }
    public decimal OtherCharges { get; set; }
}

public class PublicBookingRequest
{
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string FromDate { get; set; } = string.Empty; // yyyy-MM-dd
    public string ToDate { get; set; } = string.Empty;
    public string BusType { get; set; } = string.Empty;
    public int Passengers { get; set; }
    public string PlacesToCover { get; set; } = string.Empty;
    public Guid? BusId { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal? PerDayRent { get; set; }
    public decimal? MountainRent { get; set; }
    public string? PaymentId { get; set; }
    public decimal DriverCharges { get; set; }
    public decimal TollCharges { get; set; }
    public decimal FastTagCharges { get; set; }
    public decimal OtherCharges { get; set; }
}
