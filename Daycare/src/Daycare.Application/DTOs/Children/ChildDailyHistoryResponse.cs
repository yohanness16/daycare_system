using Daycare.Application.DTOs.Attendance;
using Daycare.Application.DTOs.DailyActivities;
using Daycare.Application.DTOs.Meals;

namespace Daycare.Application.DTOs.Children;

public class ChildDailyHistoryResponse
{
    public Guid ChildId { get; set; }

    public string ChildName { get; set; } = string.Empty;

    public DateOnly Date { get; set; }

    public AttendanceResponse? Attendance { get; set; }

    public IReadOnlyList<MealResponse> Meals { get; set; } = [];

    public IReadOnlyList<DailyActivityResponse> Activities { get; set; } = [];
}
