using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TourBooking.Api.Models;

public enum UserRole
{
    TenantAdmin = 0,
    Driver = 1,
    // SuperAdmin users might not belong to a specific tenant or have a special handling, 
    // but for simplicity we can handle them as a specific role or separate logic.
    // For now, let's keep it simple.
    SuperAdmin = 99
}

public class User
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    public UserRole Role { get; set; } = UserRole.TenantAdmin;

    public int? TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
