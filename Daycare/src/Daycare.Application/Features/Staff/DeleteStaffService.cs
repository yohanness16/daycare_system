using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Staff;

public interface IDeleteStaffService
{
    Task ExecuteAsync(Guid id, CancellationToken cancellationToken = default);
}

public class DeleteStaffService : IDeleteStaffService
{
    private readonly IDaycareDbContext _db;
    private readonly ICurrentUserService? _currentUserService;

    public DeleteStaffService(IDaycareDbContext db, ICurrentUserService? currentUserService = null)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _currentUserService = currentUserService;
    }

    public async Task ExecuteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var staff = await _db.Staff
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (staff is null)
            throw new KeyNotFoundException($"Staff member with ID '{id}' was not found.");

        if (_currentUserService?.StaffId == id)
            throw new InvalidOperationException("You cannot delete your own staff account.");

        if (staff.StaffRole == Daycare.Domain.Entities.StaffRole.Admin)
        {
            var adminCount = await _db.Staff.CountAsync(s => s.StaffRole == Daycare.Domain.Entities.StaffRole.Admin, cancellationToken);
            if (adminCount <= 1)
                throw new InvalidOperationException("Cannot delete the last administrator.");
        }

        var meals = await _db.Meals.CountAsync(m => m.StaffId == id, cancellationToken);
        var attendances = await _db.Attendances.CountAsync(a => a.RecordedById == id, cancellationToken);
        var activities = await _db.DailyActivities.CountAsync(da => da.RecordedById == id, cancellationToken);
        var classrooms = await _db.ClassroomStaff.CountAsync(cs => cs.StaffId == id, cancellationToken);

        if (meals > 0 || attendances > 0 || activities > 0 || classrooms > 0)
        {
            throw new Daycare.Domain.Exceptions.HasDependentsException(
                $"Cannot delete staff member '{staff.FirstName} {staff.LastName}' because they have associated records. Consider deactivating the staff member instead.",
                new Dictionary<string, int>
                {
                    { "mealRecords", meals },
                    { "attendanceRecords", attendances },
                    { "activityRecords", activities },
                    { "activeClassrooms", classrooms }
                });
        }

        _db.Staff.Remove(staff);
        await _db.SaveChangesAsync(cancellationToken);
    }
}

