namespace TourBooking.Api.Models;

public sealed class BusExpense
{
	public Guid Id { get; set; }

	public Guid TripExpenseId { get; set; }
	public TripExpense TripExpense { get; set; } = null!;

	// Tie to real assigned bus when available; otherwise null for "Bus 1..N" style entries.
	public Guid? BusId { get; set; }
	public Bus? Bus { get; set; }

	public decimal DriverBatta { get; set; }
	public int Days { get; set; }
	public int? StartKm { get; set; }
	public int? EndKm { get; set; }
	public int DisplayOrder { get; set; }

	public List<FuelEntry> FuelEntries { get; set; } = new();
	public List<OtherExpense> OtherExpenses { get; set; } = new();
}
