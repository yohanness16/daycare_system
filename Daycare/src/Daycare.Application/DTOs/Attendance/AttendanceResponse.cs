using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.Attendance;

public class AttendanceResponse
{
    public Guid Id { get; set; }

    public Guid ChildId { get; set; }

    public string ChildName { get; set; } = string.Empty;

    public DateOnly Date { get; set; }

    public DateTime? ArrivalTime { get; set; }

    public DateTime? DepartureTime { get; set; }

    public bool IsPresent { get; set; }

    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;

    public string? PickedUpBy { get; set; }

    public Guid? PickedUpByPickupId { get; set; }

    public bool UnverifiedPickup { get; set; }

    public int? Mood { get; set; }

    public double? DurationMinutes { get; set; }

    public Guid? RecordedById { get; set; }

    public string RecordedByName { get; set; } = string.Empty;

    public string Note { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
