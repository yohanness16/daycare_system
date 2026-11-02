using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.Meals;

public class RecordMealRequest
{
    public Guid ChildId { get; set; }

    public Guid? StaffId { get; set; }

    public MealType Type { get; set; }

    public string Food { get; set; } = string.Empty;

    public DateTime MealTime { get; set; }

    public MealStatus Status { get; set; }

    public string Notes { get; set; } = string.Empty;
}
