namespace TourBooking.Api.Contracts;

public sealed class AgreementAccountsResponse
{
	public Guid AgreementId { get; set; }

	// Income is based on Agreement.TotalAmount
	public decimal IncomeTotalAmount { get; set; }

	public decimal TotalExpenses { get; set; }
	public decimal ProfitOrLoss { get; set; }

	// Helpful for UI when tour is partially assigned.
	public int RequiredBusCount { get; set; }

	// Buses assigned to this agreement (can be empty).
	public List<BusResponse> AssignedBuses { get; set; } = new();

	public DateTime? UpdatedAtUtc { get; set; }

	public List<BusExpenseDto> BusExpenses { get; set; } = new();
}

public sealed class BusExpenseDto
{
	public Guid Id { get; set; }
	public Guid? BusId { get; set; }
	public string? BusVehicleNumber { get; set; }
	public string? BusName { get; set; }

	public decimal DriverBatta { get; set; }
	public int Days { get; set; }
	public int? StartKm { get; set; }
	public int? EndKm { get; set; }

	public decimal TotalFuelCost { get; set; }
	public decimal TotalOtherExpenses { get; set; }
	public decimal TotalExpenses { get; set; }

	public List<FuelEntryDto> FuelEntries { get; set; } = new();
	public List<OtherExpenseDto> OtherExpenses { get; set; } = new();
}

public sealed class FuelEntryDto
{
	public Guid Id { get; set; }
	public string Place { get; set; } = string.Empty;
	public decimal Liters { get; set; }
	public decimal Cost { get; set; }
}

public sealed class OtherExpenseDto
{
	public Guid Id { get; set; }
	public string Description { get; set; } = string.Empty;
	public decimal Amount { get; set; }
}
