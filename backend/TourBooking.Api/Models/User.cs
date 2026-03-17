namespace TourBooking.Api.Models;

public sealed class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string CompanyAddress { get; set; } = string.Empty;
    public string CompanyPhone { get; set; } = string.Empty;
    public string CompanyEmail { get; set; } = string.Empty;
    public string? UpiLink { get; set; } // e.g. "upi://pay?pa=partner@upi"

    // Default rates for this partner
    public decimal DriverCharges { get; set; } = 500;
    public decimal TollCharges { get; set; } = 0;
    public decimal FastTagCharges { get; set; } = 0;
    public decimal OtherCharges { get; set; } = 0;

    // SaaS Settings
    public string Role { get; set; } = "Partner"; // "SuperAdmin" or "Partner"
    public string SubscriptionStatus { get; set; } = "Active"; // "Active", "Pending", "Expired"
    public DateTime? SubscriptionValidUntil { get; set; }
    public string? AdminPayLink { get; set; } // The link Super Admin sets for partners to pay
}
