using Microsoft.AspNetCore.Mvc;
using TourBooking.Api.Contracts;
using TourBooking.Api.Services;

namespace TourBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest req)
    {
        var token = await _authService.LoginAsync(req.Username, req.Password);
        if (token == null) return Unauthorized("Invalid credentials");
        return Ok(new LoginResponse(token));
    }

    [HttpPost("register-tenant")]
    public async Task<IActionResult> RegisterTenant(RegisterTenantRequest req)
    {
        try
        {
            var tenant = await _authService.RegisterTenantAsync(req.TenantName, req.AdminUsername, req.AdminPassword);
            return Ok(tenant);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
