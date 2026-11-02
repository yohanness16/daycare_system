using Daycare.Application.DTOs.Meals;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Meals;

public interface IUpdateMealService
{
    Task<MealResponse> ExecuteAsync(Guid mealId, UpdateMealRequest request, CancellationToken cancellationToken = default);
}

public class UpdateMealService : IUpdateMealService
{
    private readonly IDaycareDbContext _db;

    public UpdateMealService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<MealResponse> ExecuteAsync(Guid mealId, UpdateMealRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (mealId == Guid.Empty)
            throw new ArgumentException("A valid mealId is required.", nameof(mealId));

        if (string.IsNullOrWhiteSpace(request.Food))
            throw new ArgumentException("Food description is required.", nameof(request.Food));

        var meal = await _db.Meals
            .Include(m => m.Child)
            .Include(m => m.Staff)
            .FirstOrDefaultAsync(m => m.Id == mealId, cancellationToken);

        if (meal is null)
            throw new KeyNotFoundException($"Meal record with ID '{mealId}' was not found.");

        if (request.StaffId.HasValue && request.StaffId.Value != Guid.Empty && request.StaffId.Value != meal.StaffId)
        {
            var staffExists = await _db.Staff.AnyAsync(s => s.Id == request.StaffId.Value, cancellationToken);
            if (!staffExists)
                throw new KeyNotFoundException($"Staff member with ID '{request.StaffId.Value}' was not found.");

            meal.StaffId = request.StaffId.Value;
        }

        meal.Food = request.Food.Trim();
        meal.Type = request.Type;
        meal.MealTime = request.MealTime == default ? meal.MealTime : request.MealTime;
        meal.Status = request.Status;
        meal.Notes = request.Notes?.Trim() ?? string.Empty;
        meal.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        // Reload staff if changed
        var staff = await _db.Staff.FirstOrDefaultAsync(s => s.Id == meal.StaffId, cancellationToken);

        return new MealResponse
        {
            Id = meal.Id,
            ChildId = meal.ChildId,
            ChildName = meal.Child != null ? $"{meal.Child.FirstName} {meal.Child.LastName}".Trim() : string.Empty,
            StaffId = meal.StaffId,
            StaffName = staff != null ? $"{staff.FirstName} {staff.LastName}".Trim() : string.Empty,
            Type = meal.Type,
            Food = meal.Food,
            MealTime = meal.MealTime,
            Status = meal.Status,
            Notes = meal.Notes,
            CreatedAt = meal.CreatedAt,
            UpdatedAt = meal.UpdatedAt
        };
    }
}
