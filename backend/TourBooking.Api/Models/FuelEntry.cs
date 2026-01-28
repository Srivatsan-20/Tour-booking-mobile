namespace TourBooking.Api.Models;

public sealed class FuelEntry
{
	public Guid Id { get; set; }

	public Guid BusExpenseId { get; set; }
	public BusExpense BusExpense { get; set; } = null!;

	public string Place { get; set; } = string.Empty;
	public decimal Liters { get; set; }
	public decimal Cost { get; set; }
}
