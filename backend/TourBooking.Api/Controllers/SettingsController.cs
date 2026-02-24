using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourBooking.Api.Data;
using TourBooking.Api.Models;
using Microsoft.AspNetCore.Authorization;

namespace TourBooking.Api.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize] // Only logged in users (admins/partners) can manage settings
public sealed class SettingsController : ControllerBase
{
    private readonly AppDbContext _db;

    public SettingsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<SystemSetting>>> GetAll()
    {
        return await _db.SystemSettings.AsNoTracking().ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult> Update([FromBody] SystemSetting setting)
    {
        var existing = await _db.SystemSettings.FirstOrDefaultAsync(x => x.Key == setting.Key);
        if (existing == null)
        {
            _db.SystemSettings.Add(setting);
        }
        else
        {
            existing.Value = setting.Value;
            existing.Group = setting.Group;
            existing.UpdatedAtUtc = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok();
    }
}
