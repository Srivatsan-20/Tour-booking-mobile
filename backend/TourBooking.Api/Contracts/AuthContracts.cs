namespace TourBooking.Api.Contracts;

public record LoginRequest(string Username, string Password);

public record LoginResponse(string Token);

public record RegisterTenantRequest(string TenantName, string AdminUsername, string AdminPassword);
