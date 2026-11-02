namespace Daycare.Domain.Entities;

public class ParentNotification
{
    public Guid Id { get; set; }

    public Guid? GuardianId { get; set; }

    public Guid? ChildId { get; set; }

    public string Type { get; set; } = "NOTIFICATION"; // INCIDENT_CREATED, ATTENDANCE_CHECKIN, DAILY_REPORT, ANNOUNCEMENT

    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public string Priority { get; set; } = "Normal"; // Normal, High, Urgent

    public string? ActionUrl { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
