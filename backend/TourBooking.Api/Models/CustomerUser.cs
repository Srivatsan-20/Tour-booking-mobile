namespace TourBooking.Api.Models;

public sealed class CustomerUser
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty; // used as login username
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }

    // Navigation: all agreements booked by this customer
    public List<Agreement> Agreements { get; set; } = new();
}
