namespace TourBooking.Api.Models;

public sealed class Agreement
{
    public Guid Id { get; set; }

    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;

    // Keeping dates as strings for now to match the mobile app's input format (e.g. DD/MM/YYYY).
    public string FromDate { get; set; } = string.Empty;
    public string ToDate { get; set; } = string.Empty;

    public string BusType { get; set; } = string.Empty;
    public int? BusCount { get; set; }
    public int? Passengers { get; set; }

    public string PlacesToCover { get; set; } = string.Empty;

    public decimal? TotalAmount { get; set; }
    public decimal? AdvancePaid { get; set; }
    public decimal? Balance { get; set; }

    // Rent calculation inputs (persisted so we can show the breakdown later)
    public decimal? PerDayRent { get; set; }
    public bool IncludeMountainRent { get; set; }
    public decimal? MountainRent { get; set; }
    public bool UseIndividualBusRates { get; set; }
    public string? BusRatesJson { get; set; }

    public string Notes { get; set; } = string.Empty;

    public bool IsCancelled { get; set; }
    public DateTime? CancelledAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public List<AgreementBusAssignment> BusAssignments { get; set; } = new();

	// Accounts / expenses (optional; created when operator adds expenses)
	public TripExpense? TripExpense { get; set; }
}
