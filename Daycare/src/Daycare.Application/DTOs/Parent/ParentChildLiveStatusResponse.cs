namespace Daycare.Application.DTOs.Parent;

public class ParentChildLiveStatusResponse
{
    public Guid ChildId { get; set; }
    public DateTime AsOf { get; set; } = DateTime.UtcNow;
    public ParentLiveAttendanceStatus Attendance { get; set; } = new();
    public ParentLiveLocation Location { get; set; } = new();
    public ParentLiveActivity? CurrentActivity { get; set; }
    public ParentLiveTodayStats Today { get; set; } = new();
    public ParentLiveMood Mood { get; set; } = new();
    public ParentLiveHealth Health { get; set; } = new();
}

public class ParentLiveAttendanceStatus
{
    public string Status { get; set; } = "NotArrived";
    public string? ArrivalTime { get; set; }
    public string? DepartureTime { get; set; }
    public string? CheckedInBy { get; set; }
}

public class ParentLiveLocation
{
    public Guid ClassroomId { get; set; }
    public string ClassroomName { get; set; } = string.Empty;
}

public class ParentLiveActivity
{
    public Guid Id { get; set; }
    public int Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public int ElapsedMinutes { get; set; }
}

public class ParentLiveTodayStats
{
    public ParentLiveMealsStats Meals { get; set; } = new();
    public ParentLiveNapsStats Naps { get; set; } = new();
    public ParentLiveCountStats Activities { get; set; } = new();
    public ParentLiveCountStats Diapers { get; set; } = new();
    public int Incidents { get; set; }
}

public class ParentLiveMealsStats
{
    public int Count { get; set; }
    public int Eaten { get; set; }
    public int PartiallyEaten { get; set; }
    public int NotEaten { get; set; }
}

public class ParentLiveNapsStats
{
    public int Count { get; set; }
    public int TotalMinutes { get; set; }
}

public class ParentLiveCountStats
{
    public int Count { get; set; }
}

public class ParentLiveMood
{
    public int? Current { get; set; }
    public IReadOnlyList<ParentMoodHistoryEntry> History { get; set; } = Array.Empty<ParentMoodHistoryEntry>();
}

public class ParentMoodHistoryEntry
{
    public DateTime At { get; set; }
    public int Mood { get; set; }
}

public class ParentLiveHealth
{
    public ParentHealthTemperature? LastTemperature { get; set; }
    public IReadOnlyList<ParentHealthAlertEntry> Alerts { get; set; } = Array.Empty<ParentHealthAlertEntry>();
}

public class ParentHealthTemperature
{
    public decimal Value { get; set; }
    public string Unit { get; set; } = "°C";
    public DateTime At { get; set; }
}

public class ParentHealthAlertEntry
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Severity { get; set; } = "Info";
    public string? Description { get; set; }
    public DateTime? Time { get; set; }
}
