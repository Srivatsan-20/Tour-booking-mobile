namespace TourBooking.Api.Contracts;

public sealed class AgreementAddAdvanceRequest
{
    /// <summary>
    /// Additional advance amount to add to the existing advance. Accepts a string to match the
    /// mobile app input format (e.g. "5000" or "5,000").
    /// </summary>
    public string? Amount { get; set; }

    /// <summary>
    /// Optional note (will be appended to Notes).
    /// </summary>
    public string? Note { get; set; }
}

