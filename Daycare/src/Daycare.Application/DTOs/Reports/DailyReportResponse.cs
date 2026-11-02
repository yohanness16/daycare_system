using Daycare.Application.DTOs.Attendance;
using Daycare.Application.DTOs.DailyActivities;
using Daycare.Application.DTOs.Meals;

namespace Daycare.Application.DTOs.Reports;

public class DailyReportResponse
{
    public DateOnly Date { get; set; }

    public Guid? ClassroomId { get; set; }

    public string? ClassroomName { get; set; }

    public int TotalChildren { get; set; }

    public int TotalPresent { get; set; }

    public int TotalAbsent { get; set; }

    public int TotalMeals { get; set; }

    public int TotalActivities { get; set; }

    public IReadOnlyList<AttendanceResponse> Attendance { get; set; } = Array.Empty<AttendanceResponse>();

    public IReadOnlyList<MealResponse> Meals { get; set; } = Array.Empty<MealResponse>();

    public IReadOnlyList<DailyActivityResponse> Activities { get; set; } = Array.Empty<DailyActivityResponse>();

    public IReadOnlyList<ChildDailyConsolidatedReport> Children { get; set; } = Array.Empty<ChildDailyConsolidatedReport>();
}

public class ChildDailyConsolidatedReport
{
    public Guid ChildId { get; set; }

    public string ChildName { get; set; } = string.Empty;

    public string? ClassroomName { get; set; }

    public AttendanceResponse? Attendance { get; set; }

    public IReadOnlyList<MealResponse> Meals { get; set; } = Array.Empty<MealResponse>();

    public IReadOnlyList<DailyActivityResponse> Activities { get; set; } = Array.Empty<DailyActivityResponse>();
}
