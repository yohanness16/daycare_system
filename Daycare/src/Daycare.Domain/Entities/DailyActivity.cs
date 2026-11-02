namespace Daycare.Domain.Entities;

public enum ActivityType
{
    Learning,
    Play,
    Nap,
    Outdoor,
    Art,
    Music,
    Eating,
    Ill,
    Other
}

public class DailyActivity
{
    public Guid Id { get; set; }

    public Guid ChildId { get; set; }

    public Child Child { get; set; } = null!;

    public ActivityType ActivityType { get; set; } = ActivityType.Learning;

    public DateTime StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    public string ActivityDescription { get; set; } = string.Empty;

    public Guid? RecordedById { get; set; }

    public Staff? RecordedBy { get; set; }

    public string Note { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}