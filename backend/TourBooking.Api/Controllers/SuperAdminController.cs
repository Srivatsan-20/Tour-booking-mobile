using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourBooking.Api.Data;
using TourBooking.Api.Models;

namespace TourBooking.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class SuperAdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public SuperAdminController(AppDbContext context)
    {
        _context = context;
    }

    private async Task<bool> IsSuperAdmin()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
        {
            return false;
        }

        var user = await _context.Users.FindAsync(userId);
        return user?.Role == "SuperAdmin";
    }

    [HttpGet("partners")]
    public async Task<IActionResult> GetPartners()
    {
        if (!await IsSuperAdmin()) return Forbid();

        var partners = await _context.Users
            .Where(u => u.Role == "Partner")
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.CompanyName,
                u.CompanyPhone,
                u.Email,
                u.SubscriptionStatus,
                u.SubscriptionValidUntil,
                u.Role
            })
            .ToListAsync();

        return Ok(partners);
    }

    [HttpPost("partners/{id}/activate")]
    public async Task<IActionResult> ActivateSubscription(int id)
    {
        if (!await IsSuperAdmin()) return Forbid();

        var partner = await _context.Users.FindAsync(id);
        if (partner == null || partner.Role != "Partner") return NotFound("Partner not found.");

        partner.SubscriptionStatus = "Active";
        partner.SubscriptionValidUntil = DateTime.UtcNow.AddDays(30);

        await _context.SaveChangesAsync();

        return Ok(new { message = "Subscription activated.", validUntil = partner.SubscriptionValidUntil });
    }
}
