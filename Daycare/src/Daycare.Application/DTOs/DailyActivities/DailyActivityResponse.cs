using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.DailyActivities;

public class DailyActivityResponse
{
    public Guid Id { get; set; }

    public Guid ChildId { get; set; }

    public string ChildName { get; set; } = string.Empty;

    public ActivityType ActivityType { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    public string ActivityDescription { get; set; } = string.Empty;

    public Guid? RecordedById { get; set; }

    public string RecordedByName { get; set; } = string.Empty;

    public string Note { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
