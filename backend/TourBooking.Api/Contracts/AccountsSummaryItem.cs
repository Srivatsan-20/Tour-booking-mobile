namespace TourBooking.Api.Contracts;

public sealed class AccountsSummaryItem
{
	public Guid AgreementId { get; set; }
	public string CustomerName { get; set; } = string.Empty;
	public string FromDate { get; set; } = string.Empty;
	public string ToDate { get; set; } = string.Empty;
	public string BusType { get; set; } = string.Empty;
	public int? BusCount { get; set; }

	public decimal IncomeTotalAmount { get; set; }
	public decimal TotalExpenses { get; set; }
	public decimal ProfitOrLoss { get; set; }

	public bool IsCancelled { get; set; }
	public DateTime CreatedAtUtc { get; set; }
}
