using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.Attendance;

public class RecordAttendanceRequest
{
    public Guid ChildId { get; set; }

    public DateTime? ArrivalTime { get; set; }

    public DateTime? ExitTime { get; set; }

    public AttendanceStatus? Status { get; set; }

    public int? Mood { get; set; }

    public Guid? RecordedById { get; set; }

    public string Note { get; set; } = string.Empty;
}
