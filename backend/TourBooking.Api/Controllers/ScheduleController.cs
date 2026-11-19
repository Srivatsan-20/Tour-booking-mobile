using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using System.Globalization;

using TourBooking.Api.Contracts;
using TourBooking.Api.Data;

namespace TourBooking.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

[ApiController]
[Route("api/schedule")]
[Authorize]
public sealed class ScheduleController : ControllerBase
{
    private readonly AppDbContext _db;

    public ScheduleController(AppDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<ActionResult<ScheduleResponse>> Get(
        [FromQuery] string from,
        [FromQuery] string to,
        CancellationToken cancellationToken)
    {
        if (!TryParseIsoDate(from, out var fromDate) || !TryParseIsoDate(to, out var toDate))
        {
            return BadRequest("from/to must be yyyy-MM-dd");
        }

        if (toDate < fromDate)
        {
            return BadRequest("to must be >= from");
        }

        // Dates are stored as dd/MM/yyyy strings, so we filter in-memory.
        var allAgreements = await _db.Agreements
            .AsNoTracking()
            .Where(x => !x.IsCancelled && x.UserId == CurrentUserId)
            .ToListAsync(cancellationToken);

        var overlapping = new List<(Guid Id, string CustomerName, string FromDate, string ToDate, string BusType, int? BusCount)>();
        foreach (var a in allAgreements)
        {
            if (!TryParseDdMmYyyy(a.FromDate, out var aFrom) || !TryParseDdMmYyyy(a.ToDate, out var aTo))
            {
                continue;
            }

            if (OverlapsInclusive(aFrom, aTo, fromDate, toDate))
            {
                overlapping.Add((a.Id, a.CustomerName, a.FromDate, a.ToDate, a.BusType, a.BusCount));
            }
        }

	    var ids = overlapping.Select(x => x.Id).ToList();
	    var assignments = ids.Count == 0
	        ? new List<Models.AgreementBusAssignment>()
	        : await _db.AgreementBusAssignments
	            .AsNoTracking()
	            .Where(x => ids.Contains(x.AgreementId))
	            .ToListAsync(cancellationToken);

	    // Include active buses, plus any inactive buses that are assigned in this range
	    // (so historical/assigned columns don't disappear when a bus gets deactivated).
	    var assignedBusIds = assignments.Select(x => x.BusId).Distinct().ToList();
	    var buses = await _db.Buses
	        .AsNoTracking()
	        .Where(x => (x.IsActive || assignedBusIds.Contains(x.Id)) && x.UserId == CurrentUserId)
	        .OrderBy(x => x.VehicleNumber)
	        .Select(x => new BusResponse
	        {
	            Id = x.Id,
	            VehicleNumber = x.VehicleNumber,
	            Name = x.Name,
	            IsActive = x.IsActive,
	            CreatedAtUtc = x.CreatedAtUtc,
	        })
	        .ToListAsync(cancellationToken);

	    var assignedByAgreement = assignments
	        .GroupBy(x => x.AgreementId)
	        .ToDictionary(g => g.Key, g => g.Select(x => x.BusId).Distinct().ToList());

        var response = new ScheduleResponse
        {
            From = from,
            To = to,
            Buses = buses,
            Agreements = overlapping
                .Select(x => new ScheduleAgreementDto
                {
                    Id = x.Id,
                    CustomerName = x.CustomerName,
                    FromDate = x.FromDate,
                    ToDate = x.ToDate,
                    BusType = x.BusType,
                    BusCount = x.BusCount,
                    AssignedBusIds = assignedByAgreement.TryGetValue(x.Id, out var list) ? list : new List<Guid>(),
                })
                .ToList(),
        };

        return response;
    }

    private static bool TryParseIsoDate(string input, out DateOnly date)
        => DateOnly.TryParseExact(input?.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);

    private static bool TryParseDdMmYyyy(string input, out DateOnly date)
    {
        var s = (input ?? string.Empty).Trim();
        var formats = new[] { "dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "yyyy-M-d", "MM/dd/yyyy", "M/d/yyyy" };
        return DateOnly.TryParseExact(s, formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out date) ||
               DateOnly.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
    }

    private static bool OverlapsInclusive(DateOnly aFrom, DateOnly aTo, DateOnly bFrom, DateOnly bTo)
        => aFrom <= bTo && bFrom <= aTo;
}
