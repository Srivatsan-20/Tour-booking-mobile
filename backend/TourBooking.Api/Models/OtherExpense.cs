namespace TourBooking.Api.Models;

public sealed class OtherExpense
{
	public Guid Id { get; set; }

	public Guid BusExpenseId { get; set; }
	public BusExpense BusExpense { get; set; } = null!;

	public string Description { get; set; } = string.Empty;
	public decimal Amount { get; set; }
}
