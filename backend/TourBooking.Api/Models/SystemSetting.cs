using System;

namespace TourBooking.Api.Models;

public sealed class SystemSetting
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Group { get; set; } = "General"; // e.g. "Terms", "Branding", "Notification"
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
