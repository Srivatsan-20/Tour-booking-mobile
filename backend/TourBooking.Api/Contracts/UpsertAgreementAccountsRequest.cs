namespace TourBooking.Api.Contracts;

public sealed class UpsertAgreementAccountsRequest
{
	public List<UpsertBusExpenseRequest> BusExpenses { get; set; } = new();
}

public sealed class UpsertBusExpenseRequest
{
	// Optional: if provided, link to actual Bus.
	public string? BusId { get; set; }

	public string? DriverBatta { get; set; }
	public string? Days { get; set; }
	public string? StartKm { get; set; }
	public string? EndKm { get; set; }

	public List<UpsertFuelEntryRequest> FuelEntries { get; set; } = new();
	public List<UpsertOtherExpenseRequest> OtherExpenses { get; set; } = new();
}

public sealed class UpsertFuelEntryRequest
{
	public string? Place { get; set; }
	public string? Liters { get; set; }
	public string? Cost { get; set; }
}

public sealed class UpsertOtherExpenseRequest
{
	public string? Description { get; set; }
	public string? Amount { get; set; }
}
