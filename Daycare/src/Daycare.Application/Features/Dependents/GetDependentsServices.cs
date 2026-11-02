using Daycare.Application.DTOs.Dependents;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Dependents;

public interface IGetGuardianDependentsService
{
    Task<GuardianDependentsResponse> ExecuteAsync(Guid guardianId, CancellationToken cancellationToken = default);
}

public class GetGuardianDependentsService : IGetGuardianDependentsService
{
    private readonly IDaycareDbContext _db;

    public GetGuardianDependentsService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<GuardianDependentsResponse> ExecuteAsync(Guid guardianId, CancellationToken cancellationToken = default)
    {
        var count = await _db.Children.CountAsync(c => c.GuardianId == guardianId, cancellationToken);
        return new GuardianDependentsResponse { Children = count };
    }
}

public interface IGetClassroomDependentsService
{
    Task<ClassroomDependentsResponse> ExecuteAsync(Guid classroomId, CancellationToken cancellationToken = default);
}

public class GetClassroomDependentsService : IGetClassroomDependentsService
{
    private readonly IDaycareDbContext _db;

    public GetClassroomDependentsService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<ClassroomDependentsResponse> ExecuteAsync(Guid classroomId, CancellationToken cancellationToken = default)
    {
        var enrollments = await _db.Enrollments.CountAsync(e => e.ClassroomId == classroomId && e.Status == EnrollmentStatus.Active, cancellationToken);
        var staff = await _db.ClassroomStaff.CountAsync(cs => cs.ClassroomId == classroomId, cancellationToken);
        return new ClassroomDependentsResponse
        {
            ActiveEnrollments = enrollments,
            ActiveStaff = staff
        };
    }
}

public interface IGetStaffDependentsService
{
    Task<StaffDependentsResponse> ExecuteAsync(Guid staffId, CancellationToken cancellationToken = default);
}

public class GetStaffDependentsService : IGetStaffDependentsService
{
    private readonly IDaycareDbContext _db;

    public GetStaffDependentsService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<StaffDependentsResponse> ExecuteAsync(Guid staffId, CancellationToken cancellationToken = default)
    {
        var meals = await _db.Meals.CountAsync(m => m.StaffId == staffId, cancellationToken);
        var attendances = await _db.Attendances.CountAsync(a => a.RecordedById == staffId, cancellationToken);
        var activities = await _db.DailyActivities.CountAsync(da => da.RecordedById == staffId, cancellationToken);
        var classrooms = await _db.ClassroomStaff.CountAsync(cs => cs.StaffId == staffId, cancellationToken);

        return new StaffDependentsResponse
        {
            MealRecords = meals,
            AttendanceRecords = attendances,
            ActivityRecords = activities,
            ActiveClassrooms = classrooms
        };
    }
}

public interface IGetChildDependentsService
{
    Task<ChildDependentsResponse> ExecuteAsync(Guid childId, CancellationToken cancellationToken = default);
}

public class GetChildDependentsService : IGetChildDependentsService
{
    private readonly IDaycareDbContext _db;

    public GetChildDependentsService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<ChildDependentsResponse> ExecuteAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        var enrollments = await _db.Enrollments.CountAsync(e => e.ChildId == childId, cancellationToken);
        var attendances = await _db.Attendances.CountAsync(a => a.ChildId == childId, cancellationToken);
        var meals = await _db.Meals.CountAsync(m => m.ChildId == childId, cancellationToken);
        var activities = await _db.DailyActivities.CountAsync(da => da.ChildId == childId, cancellationToken);

        return new ChildDependentsResponse
        {
            Enrollments = enrollments,
            Attendances = attendances,
            Meals = meals,
            Activities = activities
        };
    }
}
