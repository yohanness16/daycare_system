using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.Parent;

public class ParentChildAttendanceResponse
{
    public Guid Id { get; set; }
    public DateOnly Date { get; set; }
    public DateTime? ArrivalTime { get; set; }
    public DateTime? DepartureTime { get; set; }
    public AttendanceStatus Status { get; set; }
    public int? DurationMinutes { get; set; }
    public string? PickedUpBy { get; set; }
    public string? Note { get; set; }
    public int? Mood { get; set; }
}
