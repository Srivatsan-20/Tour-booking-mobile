using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using TourBooking.Api.Contracts;
using TourBooking.Api.Data;
using TourBooking.Api.Models;

namespace TourBooking.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

[ApiController]
[Route("api/buses")]
[Authorize]
public sealed class BusesController : ControllerBase
{
    private readonly AppDbContext _db;

    public BusesController(AppDbContext db)
    {
        _db = db;
    }

    private int CurrentUserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<ActionResult<List<BusResponse>>> List([FromQuery] bool includeInactive, CancellationToken cancellationToken)
    {
        var query = _db.Buses.AsNoTracking().Where(x => x.UserId == CurrentUserId);
        if (!includeInactive)
        {
            query = query.Where(x => x.IsActive);
        }

        var items = await query
            .OrderBy(x => x.VehicleNumber)
            .Select(x => new BusResponse
            {
                Id = x.Id,
                VehicleNumber = x.VehicleNumber,
                Name = x.Name,
                IsActive = x.IsActive,
                BusType = x.BusType,
                Capacity = x.Capacity,
                BaseRate = x.BaseRate,
                HomeCity = x.HomeCity,
                CreatedAtUtc = x.CreatedAtUtc,
            })
            .ToListAsync(cancellationToken);

        return items;
    }

    [HttpPost]
    public async Task<ActionResult<BusResponse>> Create([FromBody] CreateBusRequest request, CancellationToken cancellationToken)
    {
        var vehicleNumber = (request.VehicleNumber ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(vehicleNumber))
        {
            return BadRequest("vehicleNumber is required");
        }

        var exists = await _db.Buses.AnyAsync(x => x.VehicleNumber == vehicleNumber && x.UserId == CurrentUserId, cancellationToken);
        if (exists)
        {
            return Conflict("vehicleNumber must be unique");
        }

        var entity = new Bus
        {
            Id = Guid.NewGuid(),
            VehicleNumber = vehicleNumber,
            Name = string.IsNullOrWhiteSpace(request.Name) ? null : request.Name.Trim(),
            BusType = request.BusType ?? "AC",
            Capacity = request.Capacity ?? 40,
            BaseRate = request.BaseRate ?? 5000m,
            HomeCity = request.HomeCity?.Trim(),
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            UserId = CurrentUserId,
        };

        _db.Buses.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(List), new { id = entity.Id }, new BusResponse
        {
            Id = entity.Id,
            VehicleNumber = entity.VehicleNumber,
            Name = entity.Name,
            IsActive = entity.IsActive,
            BusType = entity.BusType,
            Capacity = entity.Capacity,
            BaseRate = entity.BaseRate,
            HomeCity = entity.HomeCity,
            CreatedAtUtc = entity.CreatedAtUtc,
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<BusResponse>> Update(Guid id, [FromBody] CreateBusRequest request, CancellationToken cancellationToken)
    {
        var entity = await _db.Buses.FirstOrDefaultAsync(x => x.Id == id && x.UserId == CurrentUserId, cancellationToken);
        if (entity is null) return NotFound();

        if (request.VehicleNumber is not null)
        {
            var vn = request.VehicleNumber.Trim();
            if (!string.IsNullOrWhiteSpace(vn) && vn != entity.VehicleNumber)
            {
                var exists = await _db.Buses.AnyAsync(x => x.VehicleNumber == vn && x.UserId == CurrentUserId, cancellationToken);
                if (exists) return Conflict("Vehicle number already in use");
                entity.VehicleNumber = vn;
            }
        }

        if (request.Name is not null) entity.Name = string.IsNullOrWhiteSpace(request.Name) ? null : request.Name.Trim();
        if (request.BusType is not null) entity.BusType = request.BusType;
        if (request.Capacity.HasValue) entity.Capacity = request.Capacity.Value;
        if (request.BaseRate.HasValue) entity.BaseRate = request.BaseRate.Value;
        if (request.HomeCity is not null) entity.HomeCity = request.HomeCity.Trim();

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new BusResponse
        {
            Id = entity.Id,
            VehicleNumber = entity.VehicleNumber,
            Name = entity.Name,
            IsActive = entity.IsActive,
            BusType = entity.BusType,
            Capacity = entity.Capacity,
            BaseRate = entity.BaseRate,
            HomeCity = entity.HomeCity,
            CreatedAtUtc = entity.CreatedAtUtc,
        });
    }


	// "Delete" is implemented as a safe soft-delete (deactivate) so existing assignments/history remain intact.
	[HttpDelete("{id:guid}")]
	public async Task<ActionResult<BusResponse>> Delete(Guid id, CancellationToken cancellationToken)
	{
		var entity = await _db.Buses.FirstOrDefaultAsync(x => x.Id == id && x.UserId == CurrentUserId, cancellationToken);
		if (entity is null)
		{
			return NotFound();
		}

		if (entity.IsActive)
		{
			entity.IsActive = false;
			await _db.SaveChangesAsync(cancellationToken);
		}

		return new BusResponse
		{
			Id = entity.Id,
			VehicleNumber = entity.VehicleNumber,
			Name = entity.Name,
			IsActive = entity.IsActive,
            BusType = entity.BusType,
            Capacity = entity.Capacity,
            BaseRate = entity.BaseRate,
            HomeCity = entity.HomeCity,
			CreatedAtUtc = entity.CreatedAtUtc,
		};
	}
}
