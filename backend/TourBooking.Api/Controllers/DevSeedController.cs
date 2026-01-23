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
        static string D(DateTime dt) => dt.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);

        // NOTE: Mountain rent is treated as a one-time amount per bus for the whole trip (not per day).
        // These totals are precomputed so the mobile UI can show the same totals/balance without needing
        // recalculation.

        var samples = new List<Agreement>
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
        };

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
}
