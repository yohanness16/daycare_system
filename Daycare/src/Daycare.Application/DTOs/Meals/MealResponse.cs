using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.Meals;

public class MealResponse
{
    public Guid Id { get; set; }

    public Guid ChildId { get; set; }

    public string ChildName { get; set; } = string.Empty;

    public Guid StaffId { get; set; }

    public string StaffName { get; set; } = string.Empty;

    public MealType Type { get; set; }

    public string Food { get; set; } = string.Empty;

    public DateTime MealTime { get; set; }

    public MealStatus Status { get; set; }

    public string Notes { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
