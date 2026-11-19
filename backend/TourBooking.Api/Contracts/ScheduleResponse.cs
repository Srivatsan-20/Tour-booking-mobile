using System.Text.Json.Serialization;

namespace TourBooking.Api.Contracts;

public sealed class ScheduleResponse
{
    [JsonPropertyName("from")]
    public string From { get; set; } = string.Empty; // yyyy-MM-dd
    [JsonPropertyName("to")]
    public string To { get; set; } = string.Empty;   // yyyy-MM-dd

    [JsonPropertyName("buses")]
    public List<BusResponse> Buses { get; set; } = new();
    [JsonPropertyName("agreements")]
    public List<ScheduleAgreementDto> Agreements { get; set; } = new();
}

public sealed class ScheduleAgreementDto
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }
    [JsonPropertyName("customerName")]
    public string CustomerName { get; set; } = string.Empty;
    [JsonPropertyName("fromDate")]
    public string FromDate { get; set; } = string.Empty; // dd/MM/yyyy
    [JsonPropertyName("toDate")]
    public string ToDate { get; set; } = string.Empty;   // dd/MM/yyyy
    [JsonPropertyName("busType")]
    public string BusType { get; set; } = string.Empty;
    [JsonPropertyName("busCount")]
    public int? BusCount { get; set; }

    [JsonPropertyName("assignedBusIds")]
    public List<Guid> AssignedBusIds { get; set; } = new();
}
