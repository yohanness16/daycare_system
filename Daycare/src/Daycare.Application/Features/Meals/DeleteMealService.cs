using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Meals;

public interface IDeleteMealService
{
    Task ExecuteAsync(Guid mealId, CancellationToken cancellationToken = default);
}

public class DeleteMealService : IDeleteMealService
{
    private readonly IDaycareDbContext _db;

    public DeleteMealService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task ExecuteAsync(Guid mealId, CancellationToken cancellationToken = default)
    {
        if (mealId == Guid.Empty)
            throw new ArgumentException("A valid mealId is required.", nameof(mealId));

        var meal = await _db.Meals
            .FirstOrDefaultAsync(m => m.Id == mealId, cancellationToken);

        if (meal is null)
            throw new KeyNotFoundException($"Meal record with ID '{mealId}' was not found.");

        _db.Meals.Remove(meal);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
