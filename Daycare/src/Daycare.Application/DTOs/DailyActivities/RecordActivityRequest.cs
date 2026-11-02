using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.DailyActivities;

public class RecordActivityRequest
{
    public Guid ChildId { get; set; }

    public ActivityType ActivityType { get; set; } = ActivityType.Learning;

    public DateTime StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    public string ActivityDescription { get; set; } = string.Empty;

    public Guid? RecordedById { get; set; }

    public string Note { get; set; } = string.Empty;
}
