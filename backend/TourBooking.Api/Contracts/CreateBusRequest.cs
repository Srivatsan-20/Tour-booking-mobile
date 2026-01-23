namespace TourBooking.Api.Contracts;

public sealed class CreateBusRequest
{
    public string? VehicleNumber { get; set; }
    public string? Name { get; set; }
}
