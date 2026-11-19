namespace TourBooking.Api.Models;

public sealed class Bus
{
    public Guid Id { get; set; }

    public int? UserId { get; set; }
    public User? User { get; set; }

    // Vehicle number shown to users (must be unique).
    public string VehicleNumber { get; set; } = string.Empty;

    // Optional friendly name (if not provided, mobile can fall back to VehicleNumber).
    public string? Name { get; set; }

    public bool IsActive { get; set; }
    public string BusType { get; set; } = "AC"; // AC, NON-AC
    public int Capacity { get; set; } = 40;
    public decimal BaseRate { get; set; } = 5000;
    public string? HomeCity { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public List<AgreementBusAssignment> AgreementAssignments { get; set; } = new();
}
