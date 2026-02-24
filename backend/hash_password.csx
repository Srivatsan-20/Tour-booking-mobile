using BCrypt.Net;

var password = "admin123";
var hash = BCrypt.HashPassword(password);
Console.WriteLine($"Password: {password}");
Console.WriteLine($"Hash: {hash}");
