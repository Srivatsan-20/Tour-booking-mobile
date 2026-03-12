using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourBooking.Api.Data;
using TourBooking.Api.Models;
using System.Security.Cryptography;
using System.Text;

namespace TourBooking.Api.Controllers;

[Route("api/public/payment")]
[ApiController]
public class PaymentController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public PaymentController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpPost("create-order")]
    public IActionResult CreateOrder([FromBody] OrderRequest request)
    {
        // For demonstration purposes, we return a mock order ID
        // In a real scenario, you would use Razorpay .NET SDK to create an order
        // var client = new RazorpayClient(key, secret);
        // var options = new Dictionary<string, object>();
        // options.Add("amount", request.Amount * 100); // amount in the smallest currency unit
        // options.Add("currency", "INR");
        // options.Add("receipt", "rcp_id_" + Guid.NewGuid().ToString().Substring(0, 8));
        // Order order = client.Order.Create(options);
        // return Ok(new { orderId = order["id"].ToString() });

        var mockOrderId = "order_" + Guid.NewGuid().ToString().Replace("-", "").Substring(0, 14);
        return Ok(new { orderId = mockOrderId });
    }

    [HttpPost("verify")]
    public async Task<IActionResult> VerifyPayment([FromBody] PaymentVerificationRequest request)
    {
        // In a real scenario, you would verify the signature using Razorpay SDK
        // Utils.verifyPaymentSignature(attributes);
        
        // Mock verification
        if (string.IsNullOrEmpty(request.RazorpayPaymentId))
        {
            return BadRequest("Invalid payment details");
        }

        return Ok(new { status = "success" });
    }
}

public class OrderRequest
{
    public decimal Amount { get; set; }
}

public class PaymentVerificationRequest
{
    public string RazorpayOrderId { get; set; } = string.Empty;
    public string RazorpayPaymentId { get; set; } = string.Empty;
    public string RazorpaySignature { get; set; } = string.Empty;
}
