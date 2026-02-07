using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourBooking.Api.Data;
using TourBooking.Api.Models;
using System.Text;
using System;

namespace TourBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DriverController : ControllerBase
{
    private readonly AppDbContext _context;

    public DriverController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/driver/validate/{token}
    [HttpGet("validate/{token}")]
    public async Task<IActionResult> ValidateToken(string token)
    {
        try
        {
            var (agreementId, busId) = DecodeToken(token);
            
            var agreement = await _context.Set<Agreement>()
                .Include(a => a.BusAssignments).ThenInclude(ab => ab.Bus)
                .FirstOrDefaultAsync(a => a.Id == agreementId);

            if (agreement == null) return NotFound("Trip not found");

            var bus = agreement.BusAssignments.FirstOrDefault(ab => ab.BusId == busId)?.Bus;
            
            // If busId is null (Bus 1, Bus 2 placeholders), we might need logic.
            // For now, assume we generate links only for assigned buses.
            var busNumber = bus?.VehicleNumber ?? "Assigned Bus";

            // Load expenses for history
            var history = new List<object>();
            var tripExpense = await _context.Set<TripExpense>()
                .Include(te => te.BusExpenses).ThenInclude(be => be.FuelEntries)
                .Include(te => te.BusExpenses).ThenInclude(be => be.OtherExpenses)
                .FirstOrDefaultAsync(te => te.AgreementId == agreementId);

            var currentStartKm = 0;
            var currentEndKm = 0;

            if (tripExpense != null)
            {
                var be = tripExpense.BusExpenses.FirstOrDefault(x => x.BusId == busId);
                if (be != null)
                {
                   currentStartKm = be.StartKm ?? 0;
                   currentEndKm = be.EndKm ?? 0;
                   history.AddRange(be.FuelEntries.Select(f => new { Type = "Fuel", Amount = f.Cost, Info = $"{f.Liters}L @ {f.Place}" }));
                   history.AddRange(be.OtherExpenses.Select(o => new { Type = "Expense", Amount = o.Amount, Info = o.Description }));
                }
            }

            return Ok(new 
            { 
                Valid = true, 
                BusNumber = busNumber, 
                TripId = agreement.Id.ToString()[..8].ToUpper(),
                IsCompleted = agreement.IsCompleted,
                History = history,
                StartKm = currentStartKm,
                EndKm = currentEndKm
            });
        }
        catch
        {
            return BadRequest("Invalid Token");
        }
    }

    // POST: api/driver/submit
    [HttpPost("submit")]
    public async Task<IActionResult> SubmitExpense([FromBody] DriverExpenseDto dto)
    {
        try
        {
            var (agreementId, busId) = DecodeToken(dto.Token);
            
            // Check if completed
            var agreement = await _context.Set<Agreement>().FindAsync(agreementId);
            if (agreement == null || agreement.IsCompleted)
            {
                return BadRequest("Tour Ended or Invalid");
            }

            // 1. Find or Create TripExpense
            var tripExpense = await _context.Set<TripExpense>()
                .Include(te => te.BusExpenses)
                .FirstOrDefaultAsync(te => te.AgreementId == agreementId);

            if (tripExpense == null)
            {
                tripExpense = new TripExpense
                {
                    Id = Guid.NewGuid(),
                    AgreementId = agreementId,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                };
                _context.Add(tripExpense);
            }

            // 2. Find or Create BusExpense
            var busExpense = tripExpense.BusExpenses.FirstOrDefault(be => be.BusId == busId);
            if (busExpense == null)
            {
                busExpense = new BusExpense
                {
                    Id = Guid.NewGuid(),
                    TripExpenseId = tripExpense.Id,
                    BusId = busId,
                    // Try to fetch bus name/number if needed, but not strictly required for record
                };
                _context.Add(busExpense);
                tripExpense.BusExpenses.Add(busExpense);
            }

            // 3. Add Entry
            if (dto.Type == "Fuel")
            {
                var entry = new FuelEntry
                {
                    Id = Guid.NewGuid(),
                    BusExpenseId = busExpense.Id,
                    Cost = dto.Amount,
                    Liters = dto.Liters ?? 0,
                    Place = dto.Place ?? "Driver Entry"
                };
                _context.Add(entry);
            }
            else // "Expense"
            {
                var entry = new OtherExpense
                {
                    Id = Guid.NewGuid(),
                    BusExpenseId = busExpense.Id,
                    Amount = dto.Amount,
                    Description = !string.IsNullOrWhiteSpace(dto.Description) 
                        ? dto.Description 
                        : dto.Category ?? "Driver Expense"
                };
                _context.Add(entry);
            }

            // Update odometer if provided
            if (dto.StartKm.HasValue)
            {
                busExpense.StartKm = dto.StartKm.Value;
            }
            if (dto.EndKm.HasValue)
            {
                busExpense.EndKm = dto.EndKm.Value;
            }

            tripExpense.UpdatedAtUtc = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { Success = true });
        }
        catch (Exception ex)
        {
            return BadRequest($"Error: {ex.Message}");
        }
    }

    private (Guid agreementId, Guid? busId) DecodeToken(string token)
    {
        var bytes = Convert.FromBase64String(token);
        var str = Encoding.UTF8.GetString(bytes);
        var parts = str.Split('|'); // Format: AgreementId|BusId
        
        var agreementId = Guid.Parse(parts[0]);
        Guid? busId = parts.Length > 1 && Guid.TryParse(parts[1], out var b) ? b : null;
        
        return (agreementId, busId);
    }

    [HttpPost("end-tour/{agreementId}")]
    public async Task<IActionResult> EndTour(Guid agreementId)
    {
        var agreement = await _context.Set<Agreement>().FindAsync(agreementId);
        if (agreement == null) return NotFound();

        agreement.IsCompleted = true;
        await _context.SaveChangesAsync();
        return Ok(new { Success = true });
    }
}

public class DriverExpenseDto
{
    public string Token { get; set; } = string.Empty;
    public string Type { get; set; } = "Fuel"; // Fuel or Expense
    public decimal Amount { get; set; }
    
    // Fuel Only
    public decimal? Liters { get; set; }
    public string? Place { get; set; }

    // Expense Only
    public string? Category { get; set; }
    public string? Description { get; set; }

    // Odometer
    public int? StartKm { get; set; }
    public int? EndKm { get; set; }
}
