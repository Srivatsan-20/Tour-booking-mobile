namespace TourBooking.Api.Contracts;

public sealed class BusAssignmentConflictResponse
{
    public string Message { get; set; } = string.Empty;
    public List<BusAssignmentConflictDto> Conflicts { get; set; } = new();
}

public sealed class BusAssignmentConflictDto
{
    public Guid BusId { get; set; }
    public string BusVehicleNumber { get; set; } = string.Empty;

    public Guid ConflictingAgreementId { get; set; }
    public string ConflictingCustomerName { get; set; } = string.Empty;
    public string ConflictingFromDate { get; set; } = string.Empty;
    public string ConflictingToDate { get; set; } = string.Empty;
}
