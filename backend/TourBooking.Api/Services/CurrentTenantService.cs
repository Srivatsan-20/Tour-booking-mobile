using Microsoft.AspNetCore.Http;

namespace TourBooking.Api.Services;

public interface ICurrentTenantService
{
    int? TenantId { get; }
    string? ConnectionString { get; } // Future proofing for separate DBs
}

public class CurrentTenantService : ICurrentTenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentTenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int? TenantId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User?.Claims
                .FirstOrDefault(c => c.Type == "tenantid");
            
            if (claim != null && int.TryParse(claim.Value, out var id))
            {
                return id;
            }
            return null;
        }
    }

    public string? ConnectionString => null;
}
