namespace Daycare.Application.DTOs.Common;

public class ApiErrorResponse
{
    public int Status { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public string? Code { get; set; }
    public IDictionary<string, string[]>? Errors { get; set; }
    public object? Dependents { get; set; }
    public int? RetryAfterSeconds { get; set; }
    public string TraceId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
