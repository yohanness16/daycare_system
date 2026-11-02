namespace Daycare.Application.DTOs.Attendance;

public class CheckOutAttendanceRequest
{
    public Guid ChildId { get; set; }

    public DateOnly? Date { get; set; }

    public DateTime? ExitTime { get; set; }

    public string? PickedUpBy { get; set; }

    public Guid? PickedUpByPickupId { get; set; }

    public bool UnverifiedPickup { get; set; }

    public Guid? RecordedById { get; set; }

    public string? Note { get; set; }
}
