using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TourBooking.Api.Data;
using TourBooking.Api.Models;
using System.Security.Cryptography;
using System.Text;
using Razorpay.Api;

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
        try 
        {
            var keyId = _config["Razorpay:KeyId"];
            var keySecret = _config["Razorpay:KeySecret"];
            if (string.IsNullOrEmpty(keyId) || string.IsNullOrEmpty(keySecret))
            {
                return BadRequest(new { message = "Razorpay configuration is missing on the server." });
            }

            var client = new RazorpayClient(keyId, keySecret);
            var options = new Dictionary<string, object>
            {
                { "amount", (int)(request.Amount * 100) }, // amount in the smallest currency unit
                { "currency", "INR" },
                { "receipt", "rcp_id_" + Guid.NewGuid().ToString().Substring(0, 8) }
            };
            Order order = client.Order.Create(options);
            return Ok(new { orderId = order["id"].ToString() });
        }
        catch(Exception ex)
        {
            return BadRequest(new { message = "Failed to create Razorpay order", error = ex.Message });
        }
    }

    [HttpPost("verify")]
    public IActionResult VerifyPayment([FromBody] PaymentVerificationRequest request)
    {
        try 
        {
            var keySecret = _config["Razorpay:KeySecret"];
            if (string.IsNullOrEmpty(request.RazorpayPaymentId) || string.IsNullOrEmpty(request.RazorpayOrderId) || string.IsNullOrEmpty(request.RazorpaySignature))
            {
                return BadRequest(new { message = "Invalid payment details provided" });
            }

            var attributes = new Dictionary<string, string>
            {
                { "razorpay_order_id", request.RazorpayOrderId },
                { "razorpay_payment_id", request.RazorpayPaymentId },
                { "razorpay_signature", request.RazorpaySignature }
            };

            Utils.verifyPaymentSignature(attributes);
            return Ok(new { status = "success" });
        }
        catch(Exception ex)
        {
            return BadRequest(new { message = "Payment signature verification failed", error = ex.Message });
        }
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
