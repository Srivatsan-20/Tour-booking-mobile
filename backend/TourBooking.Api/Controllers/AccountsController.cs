using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using System.Globalization;

using TourBooking.Api.Contracts;
using TourBooking.Api.Data;
using TourBooking.Api.Models;

namespace TourBooking.Api.Controllers;

[ApiController]
[Route("api")]
public sealed class AccountsController : ControllerBase
{
	private readonly AppDbContext _db;

	public AccountsController(AppDbContext db)
	{
		_db = db;
	}

	// Per-agreement accounts
	[HttpGet("agreements/{agreementId:guid}/accounts")]
	public async Task<ActionResult<AgreementAccountsResponse>> GetAgreementAccounts(
		Guid agreementId,
		CancellationToken cancellationToken)
	{
		var agreement = await _db.Agreements
			.AsNoTracking()
			.FirstOrDefaultAsync(x => x.Id == agreementId, cancellationToken);

		if (agreement is null)
		{
			return NotFound();
		}

		var requiredBusCount = agreement.BusCount is > 0 ? agreement.BusCount.Value : 1;

		var assignedBuses = await _db.AgreementBusAssignments
			.AsNoTracking()
			.Where(x => x.AgreementId == agreementId)
			.Include(x => x.Bus)
			.Select(x => new BusResponse
			{
				Id = x.Bus.Id,
				VehicleNumber = x.Bus.VehicleNumber,
				Name = x.Bus.Name,
				IsActive = x.Bus.IsActive,
				CreatedAtUtc = x.Bus.CreatedAtUtc,
			})
			.OrderBy(x => x.VehicleNumber)
			.ToListAsync(cancellationToken);

		var trip = await _db.TripExpenses
			.AsNoTracking()
			.Where(x => x.AgreementId == agreementId)
			.Include(x => x.BusExpenses)
				.ThenInclude(x => x.Bus)
			.Include(x => x.BusExpenses)
				.ThenInclude(x => x.FuelEntries)
			.Include(x => x.BusExpenses)
				.ThenInclude(x => x.OtherExpenses)
			.FirstOrDefaultAsync(cancellationToken);

		return MapAgreementAccountsResponse(agreement, requiredBusCount, assignedBuses, trip);
	}

	[HttpPut("agreements/{agreementId:guid}/accounts")]
	public async Task<ActionResult<AgreementAccountsResponse>> UpsertAgreementAccounts(
		Guid agreementId,
		[FromBody] UpsertAgreementAccountsRequest request,
		CancellationToken cancellationToken)
	{
		var agreement = await _db.Agreements
			.FirstOrDefaultAsync(x => x.Id == agreementId, cancellationToken);

		if (agreement is null)
		{
			return NotFound();
		}

		var trip = await _db.TripExpenses
			.Where(x => x.AgreementId == agreementId)
			.Include(x => x.BusExpenses)
				.ThenInclude(x => x.FuelEntries)
			.Include(x => x.BusExpenses)
				.ThenInclude(x => x.OtherExpenses)
			.FirstOrDefaultAsync(cancellationToken);

		if (trip is null)
		{
			trip = new TripExpense
			{
				Id = Guid.NewGuid(),
				AgreementId = agreementId,
				CreatedAtUtc = DateTime.UtcNow,
				UpdatedAtUtc = DateTime.UtcNow,
			};
			_db.TripExpenses.Add(trip);
		}
		else
		{
			trip.UpdatedAtUtc = DateTime.UtcNow;

			// Replace all child rows (simple + safe for this app)
			if (trip.BusExpenses.Count > 0)
			{
				_db.BusExpenses.RemoveRange(trip.BusExpenses);
			}
			trip.BusExpenses = new List<BusExpense>();
		}

		var tripDays = ComputeTripDaysInclusive(agreement.FromDate, agreement.ToDate);

		var busExpenses = request.BusExpenses ?? new List<UpsertBusExpenseRequest>();
		foreach (var be in busExpenses)
		{
			var busExpense = new BusExpense
			{
				Id = Guid.NewGuid(),
				TripExpenseId = trip.Id,
				BusId = ParseGuid(be.BusId),
				DriverBatta = ParseDecimal(be.DriverBatta) ?? 0m,
				// Days comes from the booking date range, so the UI doesn't need to send it.
				Days = tripDays,
				StartKm = ParseInt(be.StartKm),
				EndKm = ParseInt(be.EndKm),
			};

			foreach (var f in be.FuelEntries ?? new List<UpsertFuelEntryRequest>())
			{
				busExpense.FuelEntries.Add(new FuelEntry
				{
					Id = Guid.NewGuid(),
					Place = (f.Place ?? string.Empty).Trim(),
					Liters = ParseDecimal(f.Liters) ?? 0m,
					Cost = ParseDecimal(f.Cost) ?? 0m,
				});
			}

			foreach (var o in be.OtherExpenses ?? new List<UpsertOtherExpenseRequest>())
			{
				busExpense.OtherExpenses.Add(new OtherExpense
				{
					Id = Guid.NewGuid(),
					Description = (o.Description ?? string.Empty).Trim(),
					Amount = ParseDecimal(o.Amount) ?? 0m,
				});
			}

			trip.BusExpenses.Add(busExpense);
		}

		await _db.SaveChangesAsync(cancellationToken);

		// Return the latest state
		var requiredBusCount = agreement.BusCount is > 0 ? agreement.BusCount.Value : 1;
		var assignedBuses = await _db.AgreementBusAssignments
			.AsNoTracking()
			.Where(x => x.AgreementId == agreementId)
			.Include(x => x.Bus)
			.Select(x => new BusResponse
			{
				Id = x.Bus.Id,
				VehicleNumber = x.Bus.VehicleNumber,
				Name = x.Bus.Name,
				IsActive = x.Bus.IsActive,
				CreatedAtUtc = x.Bus.CreatedAtUtc,
			})
			.OrderBy(x => x.VehicleNumber)
			.ToListAsync(cancellationToken);

		var refreshed = await _db.TripExpenses
			.AsNoTracking()
			.Where(x => x.AgreementId == agreementId)
			.Include(x => x.BusExpenses)
				.ThenInclude(x => x.Bus)
			.Include(x => x.BusExpenses)
				.ThenInclude(x => x.FuelEntries)
			.Include(x => x.BusExpenses)
				.ThenInclude(x => x.OtherExpenses)
			.FirstOrDefaultAsync(cancellationToken);

		return MapAgreementAccountsResponse(agreement, requiredBusCount, assignedBuses, refreshed);
	}

	// Summary for all tours
	[HttpGet("accounts")]
	public async Task<ActionResult<List<AccountsSummaryItem>>> ListAccounts(
		[FromQuery] string? from,
		[FromQuery] string? to,
		[FromQuery] bool includeCancelled,
		CancellationToken cancellationToken)
	{
		DateOnly? fromDate = null;
		DateOnly? toDate = null;
		if (!string.IsNullOrWhiteSpace(from))
		{
			if (!TryParseIsoDate(from, out var d)) return BadRequest("from must be yyyy-MM-dd");
			fromDate = d;
		}
		if (!string.IsNullOrWhiteSpace(to))
		{
			if (!TryParseIsoDate(to, out var d)) return BadRequest("to must be yyyy-MM-dd");
			toDate = d;
		}
		if (fromDate is not null && toDate is not null && toDate < fromDate)
		{
			return BadRequest("to must be >= from");
		}

		var query = _db.Agreements.AsNoTracking();
		if (!includeCancelled)
		{
			query = query.Where(x => !x.IsCancelled);
		}

		// Dates are stored as dd/MM/yyyy strings, so we filter in-memory.
		var agreements = await query
			.OrderByDescending(x => x.CreatedAtUtc)
			.Take(500)
			.ToListAsync(cancellationToken);

		if (fromDate is not null || toDate is not null)
		{
			agreements = agreements.Where(a =>
			{
				if (!TryParseDdMmYyyy(a.FromDate, out var aFrom)) return false;
				if (!TryParseDdMmYyyy(a.ToDate, out var aTo)) return false;

				var rangeFrom = fromDate ?? DateOnly.MinValue;
				var rangeTo = toDate ?? DateOnly.MaxValue;
				return OverlapsInclusive(aFrom, aTo, rangeFrom, rangeTo);
			}).ToList();
		}

		var ids = agreements.Select(x => x.Id).ToList();
		var totals = ids.Count == 0
			? new Dictionary<Guid, decimal>()
			: await _db.TripExpenses
				.AsNoTracking()
				.Where(x => ids.Contains(x.AgreementId))
				.Select(x => new
				{
					x.AgreementId,
					Driver = x.BusExpenses.Sum(be => (decimal?)be.DriverBatta) ?? 0m,
					Fuel = x.BusExpenses.SelectMany(be => be.FuelEntries).Sum(f => (decimal?)f.Cost) ?? 0m,
					Other = x.BusExpenses.SelectMany(be => be.OtherExpenses).Sum(o => (decimal?)o.Amount) ?? 0m,
				})
				.ToDictionaryAsync(
					x => x.AgreementId,
					x => x.Driver + x.Fuel + x.Other,
					cancellationToken);

		var result = agreements
			.Select(a =>
			{
				var income = a.TotalAmount ?? 0m;
				var exp = totals.TryGetValue(a.Id, out var t) ? t : 0m;
				return new AccountsSummaryItem
				{
					AgreementId = a.Id,
					CustomerName = a.CustomerName,
					FromDate = a.FromDate,
					ToDate = a.ToDate,
					BusType = a.BusType,
					BusCount = a.BusCount,
					IncomeTotalAmount = income,
					TotalExpenses = exp,
					ProfitOrLoss = income - exp,
					IsCancelled = a.IsCancelled,
					CreatedAtUtc = a.CreatedAtUtc,
				};
			})
			.ToList();

		return result;
	}

	private static AgreementAccountsResponse MapAgreementAccountsResponse(
		Agreement agreement,
		int requiredBusCount,
		List<BusResponse> assignedBuses,
		TripExpense? trip)
	{
		var income = agreement.TotalAmount ?? 0m;
		var busDtos = new List<BusExpenseDto>();
		decimal totalExpenses = 0m;

		if (trip is not null)
		{
			foreach (var be in trip.BusExpenses.OrderBy(x => x.Bus?.VehicleNumber))
			{
				var fuelTotal = be.FuelEntries.Sum(x => x.Cost);
				var otherTotal = be.OtherExpenses.Sum(x => x.Amount);
				var total = be.DriverBatta + fuelTotal + otherTotal;
				totalExpenses += total;

				busDtos.Add(new BusExpenseDto
				{
					Id = be.Id,
					BusId = be.BusId,
					BusVehicleNumber = be.Bus?.VehicleNumber,
					BusName = be.Bus?.Name,
					DriverBatta = be.DriverBatta,
					Days = be.Days,
					StartKm = be.StartKm,
					EndKm = be.EndKm,
					TotalFuelCost = fuelTotal,
					TotalOtherExpenses = otherTotal,
					TotalExpenses = total,
					FuelEntries = be.FuelEntries.Select(x => new FuelEntryDto
					{
						Id = x.Id,
						Place = x.Place,
						Liters = x.Liters,
						Cost = x.Cost,
					}).ToList(),
					OtherExpenses = be.OtherExpenses.Select(x => new OtherExpenseDto
					{
						Id = x.Id,
						Description = x.Description,
						Amount = x.Amount,
					}).ToList(),
				});
			}
		}

		return new AgreementAccountsResponse
		{
			AgreementId = agreement.Id,
			IncomeTotalAmount = income,
			TotalExpenses = totalExpenses,
			ProfitOrLoss = income - totalExpenses,
			RequiredBusCount = requiredBusCount,
			AssignedBuses = assignedBuses,
			UpdatedAtUtc = trip?.UpdatedAtUtc,
			BusExpenses = busDtos,
		};
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

		cleaned = new string(cleaned.Where(c => char.IsDigit(c) || c == '.').ToArray());
		if (string.IsNullOrWhiteSpace(cleaned)) return null;

		return decimal.TryParse(cleaned, NumberStyles.Number, CultureInfo.InvariantCulture, out var n) ? n : null;
	}

	private static Guid? ParseGuid(string? input)
	{
		var s = (input ?? string.Empty).Trim();
		return Guid.TryParse(s, out var g) ? g : null;
	}

	private static bool TryParseIsoDate(string input, out DateOnly date)
		=> DateOnly.TryParseExact(input?.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);

	private static bool TryParseDdMmYyyy(string input, out DateOnly date)
	{
		var s = (input ?? string.Empty).Trim();
		return DateOnly.TryParseExact(s, new[] { "dd/MM/yyyy", "d/M/yyyy" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
	}

		private static int ComputeTripDaysInclusive(string? fromDate, string? toDate)
		{
			if (!TryParseDdMmYyyy(fromDate ?? string.Empty, out var from)) return 0;
			if (!TryParseDdMmYyyy(toDate ?? string.Empty, out var to)) return 0;

			var days = (int)(to.ToDateTime(TimeOnly.MinValue) - from.ToDateTime(TimeOnly.MinValue)).TotalDays + 1;
			return days < 0 ? 0 : days;
		}

	private static bool OverlapsInclusive(DateOnly aFrom, DateOnly aTo, DateOnly bFrom, DateOnly bTo)
		=> aFrom <= bTo && bFrom <= aTo;
}
