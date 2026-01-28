namespace TourBooking.Api.Models;

public sealed class Bus : IMustHaveTenant
{
    public Guid Id { get; set; }

    public int? TenantId { get; set; }
    public Tenant? Tenant { get; set; }

    // Vehicle number shown to users (must be unique).
    public string VehicleNumber { get; set; } = string.Empty;

    // Optional friendly name (if not provided, mobile can fall back to VehicleNumber).
    public string? Name { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public List<AgreementBusAssignment> AgreementAssignments { get; set; } = new();
}
