using Daycare.Application.Common;
using Daycare.Application.DTOs.Meals;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Meals;

public interface IRecordMealService
{
    Task<MealResponse> ExecuteAsync(RecordMealRequest request, CancellationToken cancellationToken = default);
}

public class RecordMealService : IRecordMealService
{
    private readonly IDaycareDbContext _db;
    private readonly ICurrentUserService? _currentUserService;

    public RecordMealService(IDaycareDbContext db, ICurrentUserService? currentUserService = null)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _currentUserService = currentUserService;
    }

    public async Task<MealResponse> ExecuteAsync(RecordMealRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (request.ChildId == Guid.Empty)
            throw new ArgumentException("A valid ChildId is required.", nameof(request.ChildId));

        if (string.IsNullOrWhiteSpace(request.Food))
            throw new ArgumentException("Food description is required.", nameof(request.Food));

        var staff = await StaffResolver.ResolveStaffAsync(_db, _currentUserService, request.StaffId, cancellationToken);

        var child = await _db.Children
            .FirstOrDefaultAsync(c => c.Id == request.ChildId, cancellationToken);

        if (child is null)
            throw new KeyNotFoundException($"Child with ID '{request.ChildId}' was not found.");

        var isEnrolled = await _db.Enrollments
            .AnyAsync(e => e.ChildId == request.ChildId && e.Status == EnrollmentStatus.Active, cancellationToken);

        if (!isEnrolled)
            throw new InvalidOperationException($"Child '{child.FirstName} {child.LastName}' is not actively enrolled in any classroom.");

        var mealTime = request.MealTime == default ? DateTime.UtcNow : request.MealTime;

        var meal = new Meal
        {
            Id = Guid.NewGuid(),
            ChildId = child.Id,
            StaffId = staff.Id,
            Type = request.Type,
            Food = request.Food.Trim(),
            MealTime = mealTime,
            Status = request.Status,
            Notes = request.Notes.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Meals.Add(meal);
        await _db.SaveChangesAsync(cancellationToken);

        return new MealResponse
        {
            Id = meal.Id,
            ChildId = child.Id,
            ChildName = $"{child.FirstName} {child.LastName}".Trim(),
            StaffId = staff.Id,
            StaffName = $"{staff.FirstName} {staff.LastName}".Trim(),
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
