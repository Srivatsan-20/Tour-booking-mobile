using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TourBooking.Api.Models;

namespace TourBooking.Api.Services;

public interface ITokenService
{
    string CreateToken(User user);
    string CreateCustomerToken(CustomerUser customer);
}

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string CreateToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, "partner")
        };
        return BuildToken(claims, days: 7);
    }

    public string CreateCustomerToken(CustomerUser customer)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, customer.Id.ToString()),
            new Claim(ClaimTypes.Name, customer.Phone),
            new Claim(ClaimTypes.Role, "customer")
        };
        return BuildToken(claims, days: 30);
    }

    private string BuildToken(Claim[] claims, int days)
    {
        var keyStr = _config["Jwt:Key"]
            ?? "super_secret_key_change_me_in_prod_12345_must_be_long_enough";
        var key = Encoding.UTF8.GetBytes(keyStr);

        var descriptor = new SecurityTokenDescriptor
        {
            Subject            = new ClaimsIdentity(claims),
            Expires            = DateTime.UtcNow.AddDays(days),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var handler = new JwtSecurityTokenHandler();
        return handler.WriteToken(handler.CreateToken(descriptor));
    }
}
