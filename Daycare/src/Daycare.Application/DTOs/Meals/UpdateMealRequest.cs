using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.Meals;

public class UpdateMealRequest
{
    public MealType Type { get; set; }

    public string Food { get; set; } = string.Empty;

    public DateTime MealTime { get; set; }

    public MealStatus Status { get; set; }

    public string Notes { get; set; } = string.Empty;

    public Guid? StaffId { get; set; }
}
