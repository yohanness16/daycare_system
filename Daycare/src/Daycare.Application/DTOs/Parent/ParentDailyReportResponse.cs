namespace Daycare.Application.DTOs.Parent;

public class ParentDailyReportResponse
{
    public Guid ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = true;
    public DateTime? PublishedAt { get; set; }
    public string? Summary { get; set; }
    public int? OverallMood { get; set; }
    public ParentDailyAttendance Attendance { get; set; } = new();
    public IReadOnlyList<ParentDailyMealItem> Meals { get; set; } = Array.Empty<ParentDailyMealItem>();
    public IReadOnlyList<ParentDailyActivityItem> Activities { get; set; } = Array.Empty<ParentDailyActivityItem>();
    public IReadOnlyList<ParentDailyWellbeingItem> Wellbeing { get; set; } = Array.Empty<ParentDailyWellbeingItem>();
    public IReadOnlyList<ParentDailyHealthEventItem> HealthEvents { get; set; } = Array.Empty<ParentDailyHealthEventItem>();
    public IReadOnlyList<ParentDailyDiaperItem> Diapers { get; set; } = Array.Empty<ParentDailyDiaperItem>();
    public IReadOnlyList<ParentDailyIncidentItem> Incidents { get; set; } = Array.Empty<ParentDailyIncidentItem>();
    public IReadOnlyList<ParentDailyPhotoItem> Photos { get; set; } = Array.Empty<ParentDailyPhotoItem>();
    public IReadOnlyList<ParentTimelineItem> Timeline { get; set; } = Array.Empty<ParentTimelineItem>();
}

public class ParentDailyAttendance
{
    public string Status { get; set; } = "Present";
    public string? ArrivalTime { get; set; }
    public string? DepartureTime { get; set; }
    public string? PickedUpBy { get; set; }
}

public class ParentDailyMealItem
{
    public Guid Id { get; set; }
    public string MealType { get; set; } = string.Empty;
    public string Food { get; set; } = string.Empty;
    public int PortionEaten { get; set; } // 0=None, 1=Some, 2=All
    public string? Notes { get; set; }
    public DateTime RecordedAt { get; set; }
}

public class ParentDailyActivityItem
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public IReadOnlyList<string> Photos { get; set; } = Array.Empty<string>();
}

public class ParentDailyWellbeingItem
{
    public Guid Id { get; set; }
    public int Mood { get; set; }
    public string? Note { get; set; }
    public DateTime RecordedAt { get; set; }
}

public class ParentDailyHealthEventItem
{
    public Guid Id { get; set; }
    public int Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Severity { get; set; } = "Info";
    public string? Value { get; set; }
    public string? ActionTaken { get; set; }
}

public class ParentDailyDiaperItem
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "Wet";
    public string Time { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class ParentDailyIncidentItem
{
    public Guid Id { get; set; }
    public string Severity { get; set; } = "Minor";
    public string Summary { get; set; } = string.Empty;
    public bool Acknowledged { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
}

public class ParentDailyPhotoItem
{
    public Guid Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public DateTime TakenAt { get; set; }
}

public class ParentTimelineItem
{
    public string Time { get; set; } = string.Empty;
    public string Kind { get; set; } = "activity"; // meal, activity, nap, health, attendance, incident, mood, photo, diaper
    public string RefId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string? Author { get; set; }
}
