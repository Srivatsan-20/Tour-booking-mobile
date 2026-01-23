namespace TourBooking.Api.Contracts;

public sealed class BusResponse
{
    public Guid Id { get; set; }
    public string VehicleNumber { get; set; } = string.Empty;
    public string? Name { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
