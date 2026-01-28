using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using System.Globalization;
using System.Text.Json;

using TourBooking.Api.Data;
using TourBooking.Api.Models;

namespace TourBooking.Api.Controllers;

/// <summary>
/// Dev-only endpoints to help local development.
/// </summary>
[ApiController]
[Route("api/dev")]
public sealed class DevSeedController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

	private static List<Agreement> BuildSampleAgreements(DateTime today)
	{
		static string D(DateTime dt) => dt.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);

		// NOTE: Mountain rent is treated as a one-time amount per bus for the whole trip (not per day).
		// These totals are precomputed so the mobile UI can show the same totals/balance without needing
		// recalculation.

		return new List<Agreement>
		{
			// 1) Upcoming - shared rates - mountain rent ON - partial advance
			new()
			{
				Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
				CustomerName = "[SAMPLE] Shared + Mountain (2 buses)",
				Phone = "9876543210",
				FromDate = D(today.AddDays(1)),
				ToDate = D(today.AddDays(3)), // 3 days
				BusType = "AC",
				BusCount = 2,
				Passengers = 35,
				PlacesToCover = "Kodaikanal",
				PerDayRent = 2500m,
				IncludeMountainRent = true,
				MountainRent = 600m,
				UseIndividualBusRates = false,
				BusRatesJson = null,
				TotalAmount = 16200m, // 2*2500*3 + 2*600
				AdvancePaid = 5000m,
				Balance = 11200m,
				Notes = "[SAMPLE] Shared rate + one-time mountain rent per bus.",
				CreatedAtUtc = DateTime.UtcNow.AddMinutes(-30),
			},

			// 2) Upcoming - shared rates - mountain rent OFF
			new()
			{
				Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
				CustomerName = "[SAMPLE] Shared (no mountain)",
				Phone = "9000000001",
				FromDate = D(today.AddDays(5)),
				ToDate = D(today.AddDays(6)), // 2 days
				BusType = "Non-AC",
				BusCount = 1,
				Passengers = 18,
				PlacesToCover = "Ooty",
				PerDayRent = 3000m,
				IncludeMountainRent = false,
				MountainRent = null,
				UseIndividualBusRates = false,
				BusRatesJson = null,
				TotalAmount = 6000m, // 1*3000*2
				AdvancePaid = 0m,
				Balance = 6000m,
				Notes = "[SAMPLE] Shared rate, mountain rent disabled.",
				CreatedAtUtc = DateTime.UtcNow.AddMinutes(-25),
			},

			// 3) Upcoming - individual bus rates - mixed mountain rent
			new()
			{
				Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
				CustomerName = "[SAMPLE] Individual rates (mixed mountain)",
				Phone = "9000000002",
				FromDate = D(today.AddDays(8)),
				ToDate = D(today.AddDays(9)), // 2 days
				BusType = "AC",
				BusCount = 2,
				Passengers = 42,
				PlacesToCover = "Yercaud",
				PerDayRent = null,
				IncludeMountainRent = false,
				MountainRent = null,
				UseIndividualBusRates = true,
				BusRatesJson = JsonSerializer.Serialize(new object[]
				{
					new { perDayRent = 2800m, includeMountainRent = true, mountainRent = 800m },
					new { perDayRent = 2600m, includeMountainRent = false, mountainRent = (decimal?)null },
				}, JsonOptions),
				TotalAmount = 11600m, // (2800*2 + 800) + (2600*2)
				AdvancePaid = 3000m,
				Balance = 8600m,
				Notes = "[SAMPLE] Individual bus rates; mountain rent only for Bus 1.",
				CreatedAtUtc = DateTime.UtcNow.AddMinutes(-20),
			},

			// 4) Upcoming - shared rates - advance = total (balance 0)
			new()
			{
				Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
				CustomerName = "[SAMPLE] Balance 0 (paid fully)",
				Phone = "9000000003",
				FromDate = D(today.AddDays(12)),
				ToDate = D(today.AddDays(12)), // 1 day
				BusType = "AC",
				BusCount = 1,
				Passengers = 12,
				PlacesToCover = "Local",
				PerDayRent = 5000m,
				IncludeMountainRent = false,
				MountainRent = null,
				UseIndividualBusRates = false,
				BusRatesJson = null,
				TotalAmount = 5000m,
				AdvancePaid = 5000m,
				Balance = 0m,
				Notes = "[SAMPLE] Fully paid booking (balance should be 0).",
				CreatedAtUtc = DateTime.UtcNow.AddMinutes(-15),
			},

			// 5) Cancelled - shared rates - mountain rent ON
			new()
			{
				Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
				CustomerName = "[SAMPLE] CANCELLED (shared + mountain)",
				Phone = "9000000004",
				FromDate = D(today.AddDays(2)),
				ToDate = D(today.AddDays(5)), // 4 days
				BusType = "Non-AC",
				BusCount = 1,
				Passengers = 22,
				PlacesToCover = "Valparai",
				PerDayRent = 2000m,
				IncludeMountainRent = true,
				MountainRent = 700m,
				UseIndividualBusRates = false,
				BusRatesJson = null,
				TotalAmount = 8700m, // 1*2000*4 + 1*700
				AdvancePaid = 2000m,
				Balance = 6700m,
				Notes = "[SAMPLE] Cancelled booking. [CANCELLED]",
				IsCancelled = true,
				CancelledAtUtc = DateTime.UtcNow.AddHours(-3),
				CreatedAtUtc = DateTime.UtcNow.AddMinutes(-10),
			},

			// 6) Cancelled - individual rates - mountain rent ON for all buses
			new()
			{
				Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
				CustomerName = "[SAMPLE] CANCELLED (individual + mountain)",
				Phone = "9000000005",
				FromDate = D(today.AddDays(10)),
				ToDate = D(today.AddDays(12)), // 3 days
				BusType = "AC",
				BusCount = 2,
				Passengers = 38,
				PlacesToCover = "Munnar",
				PerDayRent = null,
				IncludeMountainRent = false,
				MountainRent = null,
				UseIndividualBusRates = true,
				BusRatesJson = JsonSerializer.Serialize(new object[]
				{
					new { perDayRent = 2400m, includeMountainRent = true, mountainRent = 600m },
					new { perDayRent = 2400m, includeMountainRent = true, mountainRent = 600m },
				}, JsonOptions),
				TotalAmount = 15600m, // (2400*3 + 600) * 2
				AdvancePaid = 0m,
				Balance = 15600m,
				Notes = "[SAMPLE] Cancelled booking with individual bus rates. [CANCELLED]",
				IsCancelled = true,
				CancelledAtUtc = DateTime.UtcNow.AddHours(-2),
				CreatedAtUtc = DateTime.UtcNow.AddMinutes(-5),
			},

			// 7) Upcoming - 3 buses - for partial assignment + accounts scenarios
			new()
			{
				Id = Guid.Parse("77777777-7777-7777-7777-777777777777"),
				CustomerName = "[SAMPLE] 3 buses (partial assignment scenario)",
				Phone = "9000000006",
				FromDate = D(today.AddDays(14)),
				ToDate = D(today.AddDays(15)), // 2 days
				BusType = "AC",
				BusCount = 3,
				Passengers = 60,
				PlacesToCover = "Madurai",
				PerDayRent = 4000m,
				IncludeMountainRent = false,
				MountainRent = null,
				UseIndividualBusRates = false,
				BusRatesJson = null,
				TotalAmount = 24000m, // 3*4000*2
				AdvancePaid = 10000m,
				Balance = 14000m,
				Notes = "[SAMPLE] 3-bus tour for testing partial assignments + accounts.",
				CreatedAtUtc = DateTime.UtcNow.AddMinutes(-2),
			},
		};
	}

    public DevSeedController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    /// <summary>
    /// Inserts a set of sample bookings into the DB (idempotent).
    /// Only available in Development.
    /// </summary>
    [HttpPost("seed-sample-bookings")]
    public async Task<ActionResult<object>> SeedSampleBookings(CancellationToken cancellationToken)
    {
        if (!_env.IsDevelopment())
        {
            return NotFound();
        }

	        var today = DateTime.Today;
	        var samples = BuildSampleAgreements(today);

        var inserted = 0;
        var skipped = 0;

        foreach (var sample in samples)
        {
            var exists = await _db.Agreements.AsNoTracking().AnyAsync(x => x.Id == sample.Id, cancellationToken);
            if (exists)
            {
                skipped++;
                continue;
            }

            _db.Agreements.Add(sample);
            inserted++;
        }

        if (inserted > 0)
        {
            await _db.SaveChangesAsync(cancellationToken);
        }

        return Ok(new
        {
            inserted,
            skipped,
            sampleIds = samples.Select(x => x.Id).ToArray(),
        });
    }

	    /// <summary>
	    /// Seeds sample buses + sample bus assignments + sample accounts/expenses for the sample bookings.
	    /// Idempotent by default: will not overwrite existing TripExpense entries and will not modify
	    /// existing assignments.
	    ///
	    /// Use ?force=true to reset sample assignments + sample accounts for the sample Agreement IDs.
	    /// Only available in Development.
	    /// </summary>
	    [HttpPost("seed-sample-accounts")]
	    public async Task<ActionResult<object>> SeedSampleAccounts([FromQuery] bool force, CancellationToken cancellationToken)
	    {
	        if (!_env.IsDevelopment())
	        {
	            return NotFound();
	        }

	        // Ensure bookings exist first (same as /seed-sample-bookings)
	        var today = DateTime.Today;
	        var sampleAgreements = BuildSampleAgreements(today);
	        foreach (var sample in sampleAgreements)
	        {
	            var exists = await _db.Agreements.AsNoTracking().AnyAsync(x => x.Id == sample.Id, cancellationToken);
	            if (!exists)
	            {
	                _db.Agreements.Add(sample);
	            }
	        }
	        await _db.SaveChangesAsync(cancellationToken);

	        // Ensure a few buses exist
	        var desiredBuses = new List<Bus>
	        {
	            new() { Id = Guid.NewGuid(), VehicleNumber = "TN 01 AA 1111", Name = "Mini 1", IsActive = true, CreatedAtUtc = DateTime.UtcNow.AddMinutes(-60) },
	            new() { Id = Guid.NewGuid(), VehicleNumber = "TN 02 BB 2222", Name = "Mini 2", IsActive = true, CreatedAtUtc = DateTime.UtcNow.AddMinutes(-59) },
	            new() { Id = Guid.NewGuid(), VehicleNumber = "TN 03 CC 3333", Name = "Luxury 1", IsActive = true, CreatedAtUtc = DateTime.UtcNow.AddMinutes(-58) },
	            new() { Id = Guid.NewGuid(), VehicleNumber = "TN 04 DD 4444", Name = "Non-AC 1", IsActive = true, CreatedAtUtc = DateTime.UtcNow.AddMinutes(-57) },
	        };

	        var buses = await _db.Buses.ToListAsync(cancellationToken);
	        Bus EnsureBus(string vehicleNumber)
	        {
	            var existing = buses.FirstOrDefault(b => b.VehicleNumber == vehicleNumber);
	            if (existing is not null) return existing;
	
	            var create = desiredBuses.First(x => x.VehicleNumber == vehicleNumber);
	            _db.Buses.Add(create);
	            buses.Add(create);
	            return create;
	        }

	        var busA = EnsureBus("TN 01 AA 1111");
	        var busB = EnsureBus("TN 02 BB 2222");
	        var busC = EnsureBus("TN 03 CC 3333");
	        var busD = EnsureBus("TN 04 DD 4444");

	        await _db.SaveChangesAsync(cancellationToken);

	        var sampleAgreementIds = sampleAgreements.Select(x => x.Id).ToArray();

	        // Seed assignments.
	        // By default: do NOT touch existing assignments (so we don't accidentally exceed BusCount
	        // on a DB that already has assignments). In force mode we reset sample assignments.
	        var desiredAssignments = new Dictionary<Guid, Guid[]>
	        {
	            // 111... (2 buses) assigned A+B
	            [Guid.Parse("11111111-1111-1111-1111-111111111111")] = new[] { busA.Id, busB.Id },
	
	            // 222... (1 bus) assigned C
	            [Guid.Parse("22222222-2222-2222-2222-222222222222")] = new[] { busC.Id },
	
	            // 555... cancelled (1 bus) assigned D
	            [Guid.Parse("55555555-5555-5555-5555-555555555555")] = new[] { busD.Id },
	
	            // 666... cancelled (2 buses) partial assignment: C only
	            [Guid.Parse("66666666-6666-6666-6666-666666666666")] = new[] { busC.Id },
	
	            // 777... (3 buses) partial assignment: A+B only (missing 1)
	            [Guid.Parse("77777777-7777-7777-7777-777777777777")] = new[] { busA.Id, busB.Id },
	
	            // 333... intentionally unassigned (expenses have BusId=null)
	            // 444... intentionally unassigned
	        };

	        var assignmentsInserted = 0;
	        var assignmentsSkipped = 0;
	        var assignmentsReset = 0;

	        if (force)
	        {
	            var existingSampleAssignments = await _db.AgreementBusAssignments
	                .Where(x => sampleAgreementIds.Contains(x.AgreementId))
	                .ToListAsync(cancellationToken);
	
	            if (existingSampleAssignments.Count > 0)
	            {
	                _db.AgreementBusAssignments.RemoveRange(existingSampleAssignments);
	                assignmentsReset = existingSampleAssignments.Count;
	                await _db.SaveChangesAsync(cancellationToken);
	            }
	        }

	        foreach (var kvp in desiredAssignments)
	        {
	            var agreementId = kvp.Key;
	            var busesToAssign = kvp.Value;

	            // In non-force mode: only seed if there are no existing assignments for the agreement.
	            if (!force)
	            {
	                var hasAny = await _db.AgreementBusAssignments
	                    .AsNoTracking()
	                    .AnyAsync(x => x.AgreementId == agreementId, cancellationToken);
	
	                if (hasAny)
	                {
	                    assignmentsSkipped += busesToAssign.Length;
	                    continue;
	                }
	            }

	            foreach (var busId in busesToAssign)
	            {
	                var exists = await _db.AgreementBusAssignments
	                    .AsNoTracking()
	                    .AnyAsync(x => x.AgreementId == agreementId && x.BusId == busId, cancellationToken);
	                if (exists)
	                {
	                    assignmentsSkipped++;
	                    continue;
	                }

	                _db.AgreementBusAssignments.Add(new AgreementBusAssignment
	                {
	                    AgreementId = agreementId,
	                    BusId = busId,
	                    CreatedAtUtc = DateTime.UtcNow,
	                });
	                assignmentsInserted++;
	            }
	        }

	        if (assignmentsInserted > 0)
	        {
	            await _db.SaveChangesAsync(cancellationToken);
	        }

	        // Seed accounts/expenses
	        var insertedAccounts = 0;
	        var skippedAccounts = 0;
	        var resetAccounts = 0;

	        if (force)
	        {
	            var existingSampleTrips = await _db.TripExpenses
	                .Where(x => sampleAgreementIds.Contains(x.AgreementId))
	                .ToListAsync(cancellationToken);

	            if (existingSampleTrips.Count > 0)
	            {
	                _db.TripExpenses.RemoveRange(existingSampleTrips);
	                resetAccounts = existingSampleTrips.Count;
	                await _db.SaveChangesAsync(cancellationToken);
	            }
	        }

	        async Task EnsureTripExpense(Guid agreementId, List<BusExpense> busExpenses)
	        {
	            var exists = await _db.TripExpenses
	                .AsNoTracking()
	                .AnyAsync(x => x.AgreementId == agreementId, cancellationToken);
	            if (exists)
	            {
	                skippedAccounts++;
	                return;
	            }

	            var trip = new TripExpense
	            {
	                Id = Guid.NewGuid(),
	                AgreementId = agreementId,
	                CreatedAtUtc = DateTime.UtcNow,
	                UpdatedAtUtc = DateTime.UtcNow,
	                BusExpenses = busExpenses,
	            };

	            _db.TripExpenses.Add(trip);
	            insertedAccounts++;
	        }

	        // 111... PROFIT, multi-bus, fuel-only on bus A, other-only on bus B, with km fields
	        await EnsureTripExpense(
	            Guid.Parse("11111111-1111-1111-1111-111111111111"),
	            new List<BusExpense>
	            {
	                new()
	                {
	                    Id = Guid.NewGuid(),
	                    BusId = busA.Id,
	                    DriverBatta = 1500m,
	                    Days = 3,
	                    StartKm = 12000,
	                    EndKm = 12650,
	                    FuelEntries = new List<FuelEntry>
	                    {
	                        new() { Id = Guid.NewGuid(), Place = "Kodaikanal", Liters = 50m, Cost = 5500m },
	                        new() { Id = Guid.NewGuid(), Place = "Dindigul", Liters = 20m, Cost = 2200m },
	                    },
	                    OtherExpenses = new List<OtherExpense>(),
	                },
	                new()
	                {
	                    Id = Guid.NewGuid(),
	                    BusId = busB.Id,
	                    DriverBatta = 1500m,
	                    Days = 3,
	                    StartKm = null,
	                    EndKm = null,
	                    FuelEntries = new List<FuelEntry>(),
	                    OtherExpenses = new List<OtherExpense>
	                    {
	                        new() { Id = Guid.NewGuid(), Description = "Toll", Amount = 700m },
	                        new() { Id = Guid.NewGuid(), Description = "Parking", Amount = 300m },
	                        new() { Id = Guid.NewGuid(), Description = "Food", Amount = 800m },
	                    },
	                },
	            });

	        // 222... LOSS, single bus, everything filled
	        await EnsureTripExpense(
	            Guid.Parse("22222222-2222-2222-2222-222222222222"),
	            new List<BusExpense>
	            {
	                new()
	                {
	                    Id = Guid.NewGuid(),
	                    BusId = busC.Id,
	                    DriverBatta = 2000m,
	                    Days = 2,
	                    StartKm = 54000,
	                    EndKm = 54650,
	                    FuelEntries = new List<FuelEntry>
	                    {
	                        new() { Id = Guid.NewGuid(), Place = "Ooty", Liters = 55m, Cost = 6000m },
	                    },
	                    OtherExpenses = new List<OtherExpense>
	                    {
	                        new() { Id = Guid.NewGuid(), Description = "Service", Amount = 1500m },
	                    },
	                },
	            });

	        // 333... Unassigned buses (no busId), has expenses for Bus 1..N
	        await EnsureTripExpense(
	            Guid.Parse("33333333-3333-3333-3333-333333333333"),
	            new List<BusExpense>
	            {
	                new()
	                {
	                    Id = Guid.NewGuid(),
	                    BusId = null,
	                    DriverBatta = 1200m,
	                    Days = 2,
	                    StartKm = null,
	                    EndKm = null,
	                    FuelEntries = new List<FuelEntry>
	                    {
	                        new() { Id = Guid.NewGuid(), Place = "Yercaud", Liters = 28m, Cost = 3000m },
	                    },
	                    OtherExpenses = new List<OtherExpense>(),
	                },
	                new()
	                {
	                    Id = Guid.NewGuid(),
	                    BusId = null,
	                    DriverBatta = 1200m,
	                    Days = 2,
	                    StartKm = null,
	                    EndKm = null,
	                    FuelEntries = new List<FuelEntry>(),
	                    OtherExpenses = new List<OtherExpense>
	                    {
	                        new() { Id = Guid.NewGuid(), Description = "Toll + Snacks", Amount = 2500m },
	                    },
	                },
	            });

	        // 555... Cancelled with expenses
	        await EnsureTripExpense(
	            Guid.Parse("55555555-5555-5555-5555-555555555555"),
	            new List<BusExpense>
	            {
	                new()
	                {
	                    Id = Guid.NewGuid(),
	                    BusId = busD.Id,
	                    DriverBatta = 1600m,
	                    Days = 4,
	                    StartKm = 22000,
	                    EndKm = 22800,
	                    FuelEntries = new List<FuelEntry>
	                    {
	                        new() { Id = Guid.NewGuid(), Place = "Pollachi", Liters = 35m, Cost = 4000m },
	                    },
	                    OtherExpenses = new List<OtherExpense>(),
	                },
	            });

	        // 666... Cancelled + partial assignment (one busId + one null), LOSS
	        await EnsureTripExpense(
	            Guid.Parse("66666666-6666-6666-6666-666666666666"),
	            new List<BusExpense>
	            {
	                new()
	                {
	                    Id = Guid.NewGuid(),
	                    BusId = busC.Id,
	                    DriverBatta = 1800m,
	                    Days = 3,
	                    StartKm = 61000,
	                    EndKm = 61850,
	                    FuelEntries = new List<FuelEntry>
	                    {
	                        new() { Id = Guid.NewGuid(), Place = "Munnar", Liters = 70m, Cost = 8000m },
	                    },
	                    OtherExpenses = new List<OtherExpense>
	                    {
	                        new() { Id = Guid.NewGuid(), Description = "Permit", Amount = 1000m },
	                    },
	                },
	                new()
	                {
	                    Id = Guid.NewGuid(),
	                    BusId = null,
	                    DriverBatta = 1800m,
	                    Days = 3,
	                    StartKm = null,
	                    EndKm = null,
	                    FuelEntries = new List<FuelEntry>(),
	                    OtherExpenses = new List<OtherExpense>
	                    {
	                        new() { Id = Guid.NewGuid(), Description = "Hotel + Food", Amount = 11000m },
	                    },
	                },
	            });

	        // 777... 3 buses partial assignment, includes 1 unassigned expense row
	        await EnsureTripExpense(
	            Guid.Parse("77777777-7777-7777-7777-777777777777"),
	            new List<BusExpense>
	            {
	                new()
	                {
	                    Id = Guid.NewGuid(),
	                    BusId = busA.Id,
	                    DriverBatta = 2000m,
	                    Days = 2,
	                    StartKm = 13000,
	                    EndKm = 13400,
	                    FuelEntries = new List<FuelEntry>(),
	                    OtherExpenses = new List<OtherExpense>
	                    {
	                        new() { Id = Guid.NewGuid(), Description = "Toll", Amount = 900m },
	                    },
	                },
	                new()
	                {
	                    Id = Guid.NewGuid(),
	                    BusId = busB.Id,
	                    DriverBatta = 2000m,
	                    Days = 2,
	                    StartKm = null,
	                    EndKm = null,
	                    FuelEntries = new List<FuelEntry>
	                    {
	                        new() { Id = Guid.NewGuid(), Place = "Madurai", Liters = 40m, Cost = 4500m },
	                    },
	                    OtherExpenses = new List<OtherExpense>(),
	                },
	                new()
	                {
	                    Id = Guid.NewGuid(),
	                    BusId = null,
	                    DriverBatta = 2000m,
	                    Days = 2,
	                    StartKm = null,
	                    EndKm = null,
	                    FuelEntries = new List<FuelEntry>(),
	                    OtherExpenses = new List<OtherExpense>
	                    {
	                        new() { Id = Guid.NewGuid(), Description = "Misc", Amount = 1500m },
	                    },
	                },
	            });

	        await _db.SaveChangesAsync(cancellationToken);

	        return Ok(new
	        {
	            force,
	            assignmentsInserted,
	            assignmentsSkipped,
	            assignmentsReset,
	            resetAccounts,
	            insertedAccounts,
	            skippedAccounts,
	            sampleAgreementIds = sampleAgreements.Select(x => x.Id).ToArray(),
	            seededBuses = new[] { busA.VehicleNumber, busB.VehicleNumber, busC.VehicleNumber, busD.VehicleNumber },
	        });
	    }
}
