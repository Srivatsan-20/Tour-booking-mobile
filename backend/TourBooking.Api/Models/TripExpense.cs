namespace TourBooking.Api.Models;

public sealed class TripExpense
{
	public Guid Id { get; set; }

	public Guid AgreementId { get; set; }
	public Agreement Agreement { get; set; } = null!;

	public DateTime CreatedAtUtc { get; set; }
	public DateTime UpdatedAtUtc { get; set; }

	public List<BusExpense> BusExpenses { get; set; } = new();
}
