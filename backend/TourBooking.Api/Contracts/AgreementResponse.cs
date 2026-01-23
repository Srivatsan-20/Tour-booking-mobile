namespace TourBooking.Api.Contracts;

public sealed class AgreementResponse
{
    public Guid Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string FromDate { get; set; } = string.Empty;
    public string ToDate { get; set; } = string.Empty;
    public string BusType { get; set; } = string.Empty;
    public int? BusCount { get; set; }
    public int? Passengers { get; set; }
    public string PlacesToCover { get; set; } = string.Empty;

    // Rent details
    public decimal? PerDayRent { get; set; }
    public bool IncludeMountainRent { get; set; }
    public decimal? MountainRent { get; set; }
    public bool UseIndividualBusRates { get; set; }
    public List<AgreementBusRateDto>? BusRates { get; set; }

    public decimal? TotalAmount { get; set; }
    public decimal? AdvancePaid { get; set; }
    public decimal? Balance { get; set; }
    public string Notes { get; set; } = string.Empty;

    // Bus assignments (optional; included for endpoints that need it)
    public List<AssignedBusDto>? AssignedBuses { get; set; }

    public bool IsCancelled { get; set; }
    public DateTime? CancelledAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public sealed class AgreementBusRateDto
{
    public decimal? PerDayRent { get; set; }
    public bool IncludeMountainRent { get; set; }
    public decimal? MountainRent { get; set; }
}

public sealed class AssignedBusDto
{
    public Guid Id { get; set; }
    public string VehicleNumber { get; set; } = string.Empty;
    public string? Name { get; set; }
}
