namespace Daycare.Domain.Entities;

public enum MealType
{
    Breakfast,
    Lunch,
    Snack,
    Dinner,
    Other
}

public enum MealStatus
{
    Eaten,
    PartiallyEaten,
    NotEaten
}

public class Meal
{
    public Guid Id { get; set; }

    public Guid ChildId { get; set; }

    public Child Child { get; set; } = null!;

    public string Food { get; set; } = string.Empty;

    public MealType Type { get; set; } = MealType.Lunch;

    public DateTime MealTime { get; set; }

    public MealStatus Status { get; set; } = MealStatus.Eaten;

    public string Notes { get; set; } = string.Empty;

    public Guid StaffId { get; set; }

    public Staff Staff { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}