using Daycare.Application.DTOs.Meals;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Meals;

public interface IGetChildMealsService
{
    Task<IReadOnlyList<MealResponse>> ExecuteAsync(Guid childId, CancellationToken cancellationToken = default);
}

public class GetChildMealsService : IGetChildMealsService
{
    private readonly IDaycareDbContext _db;

    public GetChildMealsService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<MealResponse>> ExecuteAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        return await _db.Meals
            .AsNoTracking()
            .Include(m => m.Child)
            .Include(m => m.Staff)
            .Where(m => m.ChildId == childId)
            .OrderByDescending(m => m.MealTime)
            .Select(m => new MealResponse
            {
                Id = m.Id,
                ChildId = m.ChildId,
                ChildName = m.Child != null ? $"{m.Child.FirstName} {m.Child.LastName}".Trim() : string.Empty,
                StaffId = m.StaffId,
                StaffName = m.Staff != null ? $"{m.Staff.FirstName} {m.Staff.LastName}".Trim() : string.Empty,
                Type = m.Type,
                Food = m.Food,
                MealTime = m.MealTime,
                Status = m.Status,
                Notes = m.Notes,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
