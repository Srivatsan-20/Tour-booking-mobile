namespace TourBooking.Api.Models;

public sealed class AgreementBusAssignment
{
    public Guid AgreementId { get; set; }
    public Agreement Agreement { get; set; } = null!;

    public Guid BusId { get; set; }
    public Bus Bus { get; set; } = null!;

    public DateTime CreatedAtUtc { get; set; }
}
