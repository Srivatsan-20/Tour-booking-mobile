namespace TourBooking.Api.Contracts;

public sealed class ScheduleResponse
{
    public string From { get; set; } = string.Empty; // yyyy-MM-dd
    public string To { get; set; } = string.Empty;   // yyyy-MM-dd

    public List<BusResponse> Buses { get; set; } = new();
    public List<ScheduleAgreementDto> Agreements { get; set; } = new();
}

public sealed class ScheduleAgreementDto
{
    public Guid Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string FromDate { get; set; } = string.Empty; // dd/MM/yyyy
    public string ToDate { get; set; } = string.Empty;   // dd/MM/yyyy
    public string BusType { get; set; } = string.Empty;
    public int? BusCount { get; set; }

    public List<Guid> AssignedBusIds { get; set; } = new();
}
