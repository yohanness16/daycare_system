using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.Parent;

public class ParentChildCardResponse
{
    public Guid ChildId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public int AgeMonths { get; set; }
    public ParentClassroomSummary? Classroom { get; set; }
    public IReadOnlyList<ParentTeacherSummary> PrimaryTeachers { get; set; } = Array.Empty<ParentTeacherSummary>();
    public ParentChildTodaySummary Today { get; set; } = new();
}

public class ParentClassroomSummary
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class ParentTeacherSummary
{
    public Guid StaffId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
}

public class ParentChildTodaySummary
{
    public AttendanceStatus Status { get; set; } = AttendanceStatus.NotArrived;
    public DateTime? ArrivalTime { get; set; }
    public DateTime? DepartureTime { get; set; }
    public ParentActivitySummary? CurrentActivity { get; set; }
    public ParentMealSummary? LastMeal { get; set; }
    public int? Mood { get; set; }
    public string? LatestHealthAlert { get; set; }
    public int UnreadMessages { get; set; } = 0;
    public int PendingAcknowledgements { get; set; } = 0;
}

public class ParentActivitySummary
{
    public int Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public bool IsInProgress { get; set; }
}

public class ParentMealSummary
{
    public int Type { get; set; }
    public int Status { get; set; }
    public DateTime MealTime { get; set; }
}
