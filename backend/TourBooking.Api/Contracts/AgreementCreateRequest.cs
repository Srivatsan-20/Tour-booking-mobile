namespace TourBooking.Api.Contracts;

public sealed class AgreementCreateRequest
{
    public string? CustomerName { get; set; }
    public string? Phone { get; set; }
    public string? FromDate { get; set; }
    public string? ToDate { get; set; }
    public string? BusType { get; set; }
    public string? BusCount { get; set; }
    public string? Passengers { get; set; }
    public string? PlacesToCover { get; set; }

    // Rent inputs (strings to match mobile input; parsed server-side)
    public string? PerDayRent { get; set; }
    public bool? IncludeMountainRent { get; set; }
    public string? MountainRent { get; set; }
    public bool? UseIndividualBusRates { get; set; }
    public List<AgreementBusRateRequest>? BusRates { get; set; }

    public string? TotalAmount { get; set; }
    public string? AdvancePaid { get; set; }
    public string? Notes { get; set; }
}

public sealed class AgreementBusRateRequest
{
    public string? PerDayRent { get; set; }
    public bool? IncludeMountainRent { get; set; }
    public string? MountainRent { get; set; }
}
