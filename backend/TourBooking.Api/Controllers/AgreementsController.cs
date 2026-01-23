using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using System.Globalization;
using System.Text.Json;

using TourBooking.Api.Contracts;
using TourBooking.Api.Data;
using TourBooking.Api.Models;

namespace TourBooking.Api.Controllers;

[ApiController]
[Route("api/agreements")]
public sealed class AgreementsController : ControllerBase
{
    private readonly AppDbContext _db;

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public AgreementsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
	public async Task<ActionResult<List<AgreementResponse>>> List(
	    [FromQuery] bool includeCancelled,
	    CancellationToken cancellationToken)
    {
		var query = _db.Agreements.AsNoTracking();
		if (!includeCancelled)
		{
		    query = query.Where(x => !x.IsCancelled);
		}

		var items = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(200)
            .Select(x => ToResponse(x))
            .ToListAsync(cancellationToken);

        return items;
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AgreementResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var entity = await _db.Agreements
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity is null)
        {
            return NotFound();
        }

        var res = ToResponse(entity);
        res.AssignedBuses = await GetAssignedBuses(id, cancellationToken);
        return res;
    }

    [HttpPost]
    public async Task<ActionResult<AgreementResponse>> Create(
        [FromBody] AgreementCreateRequest request,
        CancellationToken cancellationToken)
    {
        var customerName = (request.CustomerName ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(customerName))
        {
            return BadRequest("customerName is required");
        }

        var totalAmount = ParseDecimal(request.TotalAmount);
        var advancePaid = ParseDecimal(request.AdvancePaid);
        var balance = (totalAmount ?? 0m) - (advancePaid ?? 0m);

        var perDayRent = ParseDecimal(request.PerDayRent);
        var includeMountainRent = request.IncludeMountainRent ?? false;
        var mountainRent = ParseDecimal(request.MountainRent);
        var useIndividualBusRates = request.UseIndividualBusRates ?? false;

        var busRates = NormalizeBusRates(request.BusRates);
        var busRatesJson = useIndividualBusRates && busRates is { Count: > 0 }
            ? JsonSerializer.Serialize(busRates, JsonOptions)
            : null;

        var entity = new Agreement
        {
            Id = Guid.NewGuid(),
            CustomerName = customerName,
            Phone = (request.Phone ?? string.Empty).Trim(),
            FromDate = (request.FromDate ?? string.Empty).Trim(),
            ToDate = (request.ToDate ?? string.Empty).Trim(),
            BusType = (request.BusType ?? string.Empty).Trim(),
            BusCount = ParseInt(request.BusCount),
            Passengers = ParseInt(request.Passengers),
            PlacesToCover = (request.PlacesToCover ?? string.Empty).Trim(),

            PerDayRent = perDayRent,
            IncludeMountainRent = includeMountainRent,
            MountainRent = mountainRent,
            UseIndividualBusRates = useIndividualBusRates,
            BusRatesJson = busRatesJson,

            TotalAmount = totalAmount,
            AdvancePaid = advancePaid,
            Balance = balance,
            Notes = (request.Notes ?? string.Empty).Trim(),
			IsCancelled = false,
			CancelledAtUtc = null,
            CreatedAtUtc = DateTime.UtcNow,
        };

        _db.Agreements.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        var res = ToResponse(entity);
        res.AssignedBuses = new List<AssignedBusDto>();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, res);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AgreementResponse>> Update(
        Guid id,
        [FromBody] AgreementCreateRequest request,
        CancellationToken cancellationToken)
    {
        var entity = await _db.Agreements
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity is null)
        {
            return NotFound();
        }

		if (entity.IsCancelled)
		{
		    return Conflict("Agreement is cancelled");
		}

        if (request.CustomerName is not null)
        {
            var customerName = request.CustomerName.Trim();
            if (string.IsNullOrWhiteSpace(customerName))
            {
                return BadRequest("customerName is required");
            }
            entity.CustomerName = customerName;
        }

        var datesMayHaveChanged = false;

        if (request.Phone is not null) entity.Phone = request.Phone.Trim();
        if (request.FromDate is not null)
        {
            entity.FromDate = request.FromDate.Trim();
            datesMayHaveChanged = true;
        }
        if (request.ToDate is not null)
        {
            entity.ToDate = request.ToDate.Trim();
            datesMayHaveChanged = true;
        }
        if (request.BusType is not null) entity.BusType = request.BusType.Trim();
        if (request.BusCount is not null) entity.BusCount = ParseInt(request.BusCount);
        if (request.Passengers is not null) entity.Passengers = ParseInt(request.Passengers);
        if (request.PlacesToCover is not null) entity.PlacesToCover = request.PlacesToCover.Trim();
        if (request.Notes is not null) entity.Notes = request.Notes.Trim();

        // Rent inputs
        if (request.PerDayRent is not null)
        {
            if (string.IsNullOrWhiteSpace(request.PerDayRent))
            {
                entity.PerDayRent = null;
            }
            else
            {
                var v = ParseDecimal(request.PerDayRent);
                if (v is null) return BadRequest("perDayRent is invalid");
                entity.PerDayRent = v;
            }
        }

        if (request.IncludeMountainRent is not null)
        {
            entity.IncludeMountainRent = request.IncludeMountainRent.Value;
        }

        if (request.MountainRent is not null)
        {
            if (string.IsNullOrWhiteSpace(request.MountainRent))
            {
                entity.MountainRent = null;
            }
            else
            {
                var v = ParseDecimal(request.MountainRent);
                if (v is null) return BadRequest("mountainRent is invalid");
                entity.MountainRent = v;
            }
        }

        if (request.UseIndividualBusRates is not null)
        {
            entity.UseIndividualBusRates = request.UseIndividualBusRates.Value;
            if (!entity.UseIndividualBusRates)
            {
                entity.BusRatesJson = null;
            }
        }

        if (request.BusRates is not null)
        {
            if (entity.UseIndividualBusRates)
            {
                var busRates = NormalizeBusRates(request.BusRates);
                entity.BusRatesJson = busRates is { Count: > 0 }
                    ? JsonSerializer.Serialize(busRates, JsonOptions)
                    : null;
            }
            else
            {
                entity.BusRatesJson = null;
            }
        }

        if (request.TotalAmount is not null)
        {
            if (!string.IsNullOrWhiteSpace(request.TotalAmount))
            {
                var totalAmount = ParseDecimal(request.TotalAmount);
                if (totalAmount is null)
                {
                    return BadRequest("totalAmount is invalid");
                }
                entity.TotalAmount = totalAmount;
            }
        }

        if (request.AdvancePaid is not null)
        {
            if (!string.IsNullOrWhiteSpace(request.AdvancePaid))
            {
                var advancePaid = ParseDecimal(request.AdvancePaid);
                if (advancePaid is null)
                {
                    return BadRequest("advancePaid is invalid");
                }
                entity.AdvancePaid = advancePaid;
            }
        }

        entity.Balance = (entity.TotalAmount ?? 0m) - (entity.AdvancePaid ?? 0m);

        // If busCount was reduced below assigned buses, block.
        var assignedCount = await _db.AgreementBusAssignments
            .AsNoTracking()
            .CountAsync(x => x.AgreementId == id, cancellationToken);
        if (entity.BusCount is not null && entity.BusCount.Value > 0 && assignedCount > entity.BusCount.Value)
        {
            return Conflict($"Assigned buses ({assignedCount}) is greater than busCount ({entity.BusCount.Value}). Unassign buses first.");
        }

        // If dates changed, validate all current bus assignments do not conflict.
        if (datesMayHaveChanged)
        {
            var conflict = await FindAssignmentConflictsForAgreement(id, entity.FromDate, entity.ToDate, cancellationToken);
            if (conflict is not null)
            {
                return Conflict(conflict);
            }
        }

        await _db.SaveChangesAsync(cancellationToken);

        var res = ToResponse(entity);
        res.AssignedBuses = await GetAssignedBuses(id, cancellationToken);
        return res;
    }

    [HttpPost("{id:guid}/assign-bus")]
    public async Task<ActionResult<AgreementResponse>> AssignBus(
        Guid id,
        [FromBody] AgreementAssignBusRequest request,
        CancellationToken cancellationToken)
    {
        var agreement = await _db.Agreements.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (agreement is null) return NotFound();
        if (agreement.IsCancelled) return Conflict("Agreement is cancelled");

        if (agreement.BusCount is null || agreement.BusCount.Value <= 0)
        {
            return BadRequest("busCount must be set before assigning buses");
        }

        var bus = await _db.Buses.FirstOrDefaultAsync(x => x.Id == request.BusId, cancellationToken);
        if (bus is null) return NotFound("Bus not found");
        if (!bus.IsActive) return Conflict("Bus is inactive");

        var currentCount = await _db.AgreementBusAssignments
            .AsNoTracking()
            .CountAsync(x => x.AgreementId == id, cancellationToken);
        if (currentCount >= agreement.BusCount.Value)
        {
            return Conflict("This agreement already has enough buses assigned");
        }

        var alreadyAssigned = await _db.AgreementBusAssignments
            .AsNoTracking()
            .AnyAsync(x => x.AgreementId == id && x.BusId == request.BusId, cancellationToken);
        if (!alreadyAssigned)
        {
            var conflict = await FindAssignmentConflictsForBus(request.BusId, id, agreement.FromDate, agreement.ToDate, cancellationToken);
            if (conflict is not null)
            {
                return Conflict(conflict);
            }

            _db.AgreementBusAssignments.Add(new AgreementBusAssignment
            {
                AgreementId = id,
                BusId = request.BusId,
                CreatedAtUtc = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync(cancellationToken);
        }

        var res = ToResponse(agreement);
        res.AssignedBuses = await GetAssignedBuses(id, cancellationToken);
        return res;
    }

    [HttpPost("{id:guid}/unassign-bus")]
    public async Task<ActionResult<AgreementResponse>> UnassignBus(
        Guid id,
        [FromBody] AgreementAssignBusRequest request,
        CancellationToken cancellationToken)
    {
        var agreement = await _db.Agreements.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (agreement is null) return NotFound();
        if (agreement.IsCancelled) return Conflict("Agreement is cancelled");

        var entity = await _db.AgreementBusAssignments
            .FirstOrDefaultAsync(x => x.AgreementId == id && x.BusId == request.BusId, cancellationToken);

        if (entity is not null)
        {
            _db.AgreementBusAssignments.Remove(entity);
            await _db.SaveChangesAsync(cancellationToken);
        }

        var res = ToResponse(agreement);
        res.AssignedBuses = await GetAssignedBuses(id, cancellationToken);
        return res;
    }

    [HttpPost("{id:guid}/advance")]
    public async Task<ActionResult<AgreementResponse>> AddAdvance(
        Guid id,
        [FromBody] AgreementAddAdvanceRequest request,
        CancellationToken cancellationToken)
    {
        var amountInput = (request.Amount ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(amountInput))
        {
            return BadRequest("amount is required");
        }

        var amount = ParseDecimal(amountInput);
        if (amount is null || amount <= 0m)
        {
            return BadRequest("amount must be a positive number");
        }

        var entity = await _db.Agreements
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity is null)
        {
            return NotFound();
        }

		if (entity.IsCancelled)
		{
		    return Conflict("Agreement is cancelled");
		}

        entity.AdvancePaid = (entity.AdvancePaid ?? 0m) + amount.Value;
        entity.Balance = (entity.TotalAmount ?? 0m) - (entity.AdvancePaid ?? 0m);

        var note = (request.Note ?? string.Empty).Trim();
        var record = $"[ADVANCE {DateTime.UtcNow:yyyy-MM-dd HH:mm}Z] +{amount.Value.ToString(CultureInfo.InvariantCulture)}";
        if (!string.IsNullOrWhiteSpace(note))
        {
            record += $" - {note}";
        }

        entity.Notes = string.IsNullOrWhiteSpace(entity.Notes)
            ? record
            : (entity.Notes.Trim() + "\n" + record);

        await _db.SaveChangesAsync(cancellationToken);

        return ToResponse(entity);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var entity = await _db.Agreements
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (entity is null)
        {
            return NotFound();
        }

		// Soft-cancel (do NOT delete records).
		if (!entity.IsCancelled)
		{
		    entity.IsCancelled = true;
		    entity.CancelledAtUtc = DateTime.UtcNow;

		    var record = $"[CANCELLED {entity.CancelledAtUtc:yyyy-MM-dd HH:mm}Z]";
		    entity.Notes = string.IsNullOrWhiteSpace(entity.Notes)
		        ? record
		        : (entity.Notes.Trim() + "\n" + record);

		    await _db.SaveChangesAsync(cancellationToken);
		}

		return NoContent();
    }

    private static AgreementResponse ToResponse(Agreement x) => new()
    {
        Id = x.Id,
        CustomerName = x.CustomerName,
        Phone = x.Phone,
        FromDate = x.FromDate,
        ToDate = x.ToDate,
        BusType = x.BusType,
        BusCount = x.BusCount,
        Passengers = x.Passengers,
        PlacesToCover = x.PlacesToCover,

        PerDayRent = x.PerDayRent,
        IncludeMountainRent = x.IncludeMountainRent,
        MountainRent = x.MountainRent,
        UseIndividualBusRates = x.UseIndividualBusRates,
        BusRates = DeserializeBusRatesOrNull(x.BusRatesJson),

        TotalAmount = x.TotalAmount,
        AdvancePaid = x.AdvancePaid,
        Balance = x.Balance,
        Notes = x.Notes,

        AssignedBuses = null,
		IsCancelled = x.IsCancelled,
		CancelledAtUtc = x.CancelledAtUtc,
        CreatedAtUtc = x.CreatedAtUtc,
    };

    private async Task<List<AssignedBusDto>> GetAssignedBuses(Guid agreementId, CancellationToken cancellationToken)
    {
        return await _db.AgreementBusAssignments
            .AsNoTracking()
            .Where(x => x.AgreementId == agreementId)
            .Join(_db.Buses.AsNoTracking(), a => a.BusId, b => b.Id, (a, b) => new AssignedBusDto
            {
                Id = b.Id,
                VehicleNumber = b.VehicleNumber,
                Name = b.Name,
            })
            .OrderBy(x => x.VehicleNumber)
            .ToListAsync(cancellationToken);
    }

    private async Task<BusAssignmentConflictResponse?> FindAssignmentConflictsForAgreement(
        Guid agreementId,
        string fromDateInput,
        string toDateInput,
        CancellationToken cancellationToken)
    {
        if (!TryParseDdMmYyyy(fromDateInput, out var from) || !TryParseDdMmYyyy(toDateInput, out var to))
        {
            return new BusAssignmentConflictResponse { Message = "Invalid fromDate/toDate format" };
        }
        if (to < from)
        {
            return new BusAssignmentConflictResponse { Message = "toDate must be >= fromDate" };
        }

        var busIds = await _db.AgreementBusAssignments
            .AsNoTracking()
            .Where(x => x.AgreementId == agreementId)
            .Select(x => x.BusId)
            .ToListAsync(cancellationToken);

        if (busIds.Count == 0) return null;

        var conflicts = new List<BusAssignmentConflictDto>();
        foreach (var busId in busIds)
        {
            var conflict = await FindAssignmentConflictsForBus(busId, agreementId, fromDateInput, toDateInput, cancellationToken);
            if (conflict is not null)
            {
                conflicts.AddRange(conflict.Conflicts);
            }
        }

        if (conflicts.Count == 0) return null;
        return new BusAssignmentConflictResponse
        {
            Message = "Bus assignment conflicts exist for the selected date range",
            Conflicts = conflicts,
        };
    }

    private async Task<BusAssignmentConflictResponse?> FindAssignmentConflictsForBus(
        Guid busId,
        Guid agreementId,
        string fromDateInput,
        string toDateInput,
        CancellationToken cancellationToken)
    {
        if (!TryParseDdMmYyyy(fromDateInput, out var from) || !TryParseDdMmYyyy(toDateInput, out var to))
        {
            return new BusAssignmentConflictResponse { Message = "Invalid fromDate/toDate format" };
        }
        if (to < from)
        {
            return new BusAssignmentConflictResponse { Message = "toDate must be >= fromDate" };
        }

        var bus = await _db.Buses.AsNoTracking().FirstOrDefaultAsync(x => x.Id == busId, cancellationToken);
        if (bus is null)
        {
            return new BusAssignmentConflictResponse { Message = "Bus not found" };
        }

        var otherAgreementIds = await _db.AgreementBusAssignments
            .AsNoTracking()
            .Where(x => x.BusId == busId && x.AgreementId != agreementId)
            .Select(x => x.AgreementId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (otherAgreementIds.Count == 0) return null;

        var others = await _db.Agreements
            .AsNoTracking()
            .Where(x => otherAgreementIds.Contains(x.Id) && !x.IsCancelled)
            .ToListAsync(cancellationToken);

        var conflicts = new List<BusAssignmentConflictDto>();
        foreach (var a in others)
        {
            if (!TryParseDdMmYyyy(a.FromDate, out var aFrom) || !TryParseDdMmYyyy(a.ToDate, out var aTo))
            {
                continue;
            }

            if (OverlapsInclusive(from, to, aFrom, aTo))
            {
                conflicts.Add(new BusAssignmentConflictDto
                {
                    BusId = busId,
                    BusVehicleNumber = bus.VehicleNumber,
                    ConflictingAgreementId = a.Id,
                    ConflictingCustomerName = a.CustomerName,
                    ConflictingFromDate = a.FromDate,
                    ConflictingToDate = a.ToDate,
                });
            }
        }

        if (conflicts.Count == 0) return null;
        return new BusAssignmentConflictResponse
        {
            Message = $"Bus {bus.VehicleNumber} is already booked for the selected date range",
            Conflicts = conflicts,
        };
    }

    private static bool TryParseDdMmYyyy(string input, out DateOnly date)
    {
        var s = (input ?? string.Empty).Trim();
        return DateOnly.TryParseExact(s, new[] { "dd/MM/yyyy", "d/M/yyyy" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
    }

    private static bool OverlapsInclusive(DateOnly aFrom, DateOnly aTo, DateOnly bFrom, DateOnly bTo)
        => aFrom <= bTo && bFrom <= aTo;

    private static List<AgreementBusRateDto>? DeserializeBusRatesOrNull(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            return JsonSerializer.Deserialize<List<AgreementBusRateDto>>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    private static List<AgreementBusRateDto>? NormalizeBusRates(List<AgreementBusRateRequest>? input)
    {
        if (input is null || input.Count == 0) return null;

        var result = new List<AgreementBusRateDto>(input.Count);
        foreach (var r in input)
        {
            result.Add(new AgreementBusRateDto
            {
                PerDayRent = ParseDecimal(r.PerDayRent),
                IncludeMountainRent = r.IncludeMountainRent ?? false,
                MountainRent = ParseDecimal(r.MountainRent),
            });
        }

        return result;
    }

    private static int? ParseInt(string? input)
    {
        var cleaned = (input ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(cleaned)) return null;

        cleaned = new string(cleaned.Where(char.IsDigit).ToArray());
        if (string.IsNullOrWhiteSpace(cleaned)) return null;

        return int.TryParse(cleaned, out var n) ? n : null;
    }

    private static decimal? ParseDecimal(string? input)
    {
        var cleaned = (input ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(cleaned)) return null;

        // Keep only digits and '.' (similar to mobile-side parsing).
        cleaned = new string(cleaned.Where(c => char.IsDigit(c) || c == '.').ToArray());
        if (string.IsNullOrWhiteSpace(cleaned)) return null;

        return decimal.TryParse(cleaned, NumberStyles.Number, CultureInfo.InvariantCulture, out var n) ? n : null;
    }
}
