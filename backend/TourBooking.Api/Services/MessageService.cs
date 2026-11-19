using System;
using System.Threading.Tasks;

namespace TourBooking.Api.Services;

public interface IMessageService
{
    Task SendBookingConfirmation(string phone, string customerName, string busName, string fromDate, string toDate, decimal? totalAmount);
}

public class MockMessageService : IMessageService
{
    public Task SendBookingConfirmation(string phone, string customerName, string busName, string fromDate, string toDate, decimal? totalAmount)
    {
        // In a real scenario, you would call WhatsApp Business API or Twilio here.
        Console.WriteLine($"[NOTIFICATION] Sending WhatsApp to {phone}");
        Console.WriteLine($"Message: Dear {customerName}, your booking for {busName} from {fromDate} to {toDate} is confirmed. Total: ₹{totalAmount}.");
        return Task.CompletedTask;
    }
}
