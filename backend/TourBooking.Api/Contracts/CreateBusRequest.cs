namespace TourBooking.Api.Contracts;

public sealed class CreateBusRequest
{
    public string? VehicleNumber { get; set; }
    public string? Name { get; set; }
    public string? BusType { get; set; }
    public int? Capacity { get; set; }
    public decimal? BaseRate { get; set; }
    public string? HomeCity { get; set; }
}
