namespace Daycare.Domain.Entities;

public enum AttendanceStatus
{
    NotArrived = 0,
    Present = 1,
    Late = 2,
    Absent = 3,
    Sick = 4,
    ExcusedAbsence = 5,
    CheckedOut = 6,
    CenterClosed = 7
}

public class Attendance 
{
    public Guid Id { get; set; }

    public Guid ChildId { get; set; }

    public Child Child { get; set; } = null!;

    public DateOnly Date { get; set; }

    public DateTime? ArrivalTime { get; set; }

    public DateTime? DepartureTime { get; set; }

    public bool IsPresent { get; set; }

    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;

    public string? PickedUpBy { get; set; }

    public Guid? PickedUpByPickupId { get; set; }

    public bool UnverifiedPickup { get; set; }

    public int? Mood { get; set; }

    public Guid? RecordedById { get; set; }

    public Staff? RecordedBy { get; set; }

    public string Note { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}