using Daycare.Application.DTOs.Attendance;
using Daycare.Application.DTOs.DailyActivities;
using Daycare.Application.DTOs.Meals;
using Daycare.Application.DTOs.Reports;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Reports;

public interface IGetDailyReportService
{
    Task<DailyReportResponse> ExecuteAsync(DateOnly date, Guid? classroomId = null, CancellationToken cancellationToken = default);
}

public class GetDailyReportService : IGetDailyReportService
{
    private readonly IDaycareDbContext _db;

    public GetDailyReportService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<DailyReportResponse> ExecuteAsync(DateOnly date, Guid? classroomId = null, CancellationToken cancellationToken = default)
    {
        var startOfDay = date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var endOfDay = date.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        string? classroomName = null;
        HashSet<Guid>? filterChildIds = null;

        if (classroomId.HasValue && classroomId.Value != Guid.Empty)
        {
            var classroom = await _db.Classrooms
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == classroomId.Value, cancellationToken);

            classroomName = classroom?.Name;

            var enrolledChildIds = await _db.Enrollments
                .AsNoTracking()
                .Where(e => e.ClassroomId == classroomId.Value && e.Status == EnrollmentStatus.Active)
                .Select(e => e.ChildId)
                .ToListAsync(cancellationToken);

            filterChildIds = enrolledChildIds.ToHashSet();
        }

        // Attendance
        var attendanceQuery = _db.Attendances
            .AsNoTracking()
            .Include(a => a.Child)
            .Include(a => a.RecordedBy)
            .Where(a => a.Date == date);

        if (filterChildIds != null)
        {
            attendanceQuery = attendanceQuery.Where(a => filterChildIds.Contains(a.ChildId));
        }

        var attendanceEntities = await attendanceQuery
            .OrderBy(a => a.Child != null ? a.Child.LastName : string.Empty)
            .ThenBy(a => a.Child != null ? a.Child.FirstName : string.Empty)
            .ToListAsync(cancellationToken);

        // Meals
        var mealsQuery = _db.Meals
            .AsNoTracking()
            .Include(m => m.Child)
            .Include(m => m.Staff)
            .Where(m => m.MealTime >= startOfDay && m.MealTime <= endOfDay);

        if (filterChildIds != null)
        {
            mealsQuery = mealsQuery.Where(m => filterChildIds.Contains(m.ChildId));
        }

        var mealEntities = await mealsQuery
            .OrderBy(m => m.MealTime)
            .ToListAsync(cancellationToken);

        // Daily Activities
        var activitiesQuery = _db.DailyActivities
            .AsNoTracking()
            .Include(da => da.Child)
            .Include(da => da.RecordedBy)
            .Where(da => da.StartTime >= startOfDay && da.StartTime <= endOfDay);

        if (filterChildIds != null)
        {
            activitiesQuery = activitiesQuery.Where(da => filterChildIds.Contains(da.ChildId));
        }

        var activityEntities = await activitiesQuery
            .OrderBy(da => da.StartTime)
            .ToListAsync(cancellationToken);

        // Map to DTOs
        var attendanceDtos = attendanceEntities.Select(a => new AttendanceResponse
        {
            Id = a.Id,
            ChildId = a.ChildId,
            ChildName = a.Child != null ? $"{a.Child.FirstName} {a.Child.LastName}".Trim() : string.Empty,
            Date = a.Date,
            ArrivalTime = a.ArrivalTime,
            DepartureTime = a.DepartureTime,
            IsPresent = a.IsPresent,
            Status = a.Status,
            PickedUpBy = a.PickedUpBy,
            PickedUpByPickupId = a.PickedUpByPickupId,
            UnverifiedPickup = a.UnverifiedPickup,
            Mood = a.Mood,
            DurationMinutes = a.DepartureTime.HasValue && a.ArrivalTime.HasValue
                ? Math.Max(0, (a.DepartureTime.Value - a.ArrivalTime.Value).TotalMinutes)
                : null,
            RecordedById = a.RecordedById,
            RecordedByName = a.RecordedBy != null ? $"{a.RecordedBy.FirstName} {a.RecordedBy.LastName}".Trim() : string.Empty,
            Note = a.Note,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        }).ToList();

        var mealDtos = mealEntities.Select(m => new MealResponse
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
        }).ToList();

        var activityDtos = activityEntities.Select(da => new DailyActivityResponse
        {
            Id = da.Id,
            ChildId = da.ChildId,
            ChildName = da.Child != null ? $"{da.Child.FirstName} {da.Child.LastName}".Trim() : string.Empty,
            RecordedById = da.RecordedById,
            RecordedByName = da.RecordedBy != null ? $"{da.RecordedBy.FirstName} {da.RecordedBy.LastName}".Trim() : string.Empty,
            ActivityType = da.ActivityType,
            StartTime = da.StartTime,
            EndTime = da.EndTime,
            ActivityDescription = da.ActivityDescription,
            Note = da.Note,
            CreatedAt = da.CreatedAt,
            UpdatedAt = da.UpdatedAt
        }).ToList();

        // Build child-level consolidated views
        var childInfoMap = new Dictionary<Guid, (string Name, string? Classroom)>();

        // Preload classrooms for children
        var childIds = attendanceEntities.Select(a => a.ChildId)
            .Concat(mealEntities.Select(m => m.ChildId))
            .Concat(activityEntities.Select(da => da.ChildId));

        if (filterChildIds != null)
        {
            childIds = childIds.Concat(filterChildIds);
        }

        var distinctChildIds = childIds.Distinct().ToList();

        var childrenInvolved = await _db.Children
            .AsNoTracking()
            .Where(c => distinctChildIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        var activeEnrollments = await _db.Enrollments
            .AsNoTracking()
            .Include(e => e.Classroom)
            .Where(e => distinctChildIds.Contains(e.ChildId) && e.Status == EnrollmentStatus.Active)
            .ToListAsync(cancellationToken);

        var enrollmentMap = activeEnrollments
            .GroupBy(e => e.ChildId)
            .ToDictionary(g => g.Key, g => g.First().Classroom?.Name);

        foreach (var c in childrenInvolved)
        {
            enrollmentMap.TryGetValue(c.Id, out var enrolledRoom);
            childInfoMap[c.Id] = ($"{c.FirstName} {c.LastName}".Trim(), enrolledRoom ?? classroomName);
        }

        var consolidatedChildren = distinctChildIds.Select(cId =>
        {
            childInfoMap.TryGetValue(cId, out var info);
            var att = attendanceDtos.FirstOrDefault(a => a.ChildId == cId);
            var mls = mealDtos.Where(m => m.ChildId == cId).ToList();
            var acts = activityDtos.Where(a => a.ChildId == cId).ToList();

            return new ChildDailyConsolidatedReport
            {
                ChildId = cId,
                ChildName = info.Name ?? string.Empty,
                ClassroomName = info.Classroom ?? classroomName,
                Attendance = att,
                Meals = mls,
                Activities = acts
            };
        }).OrderBy(c => c.ChildName).ToList();

        var totalPresent = attendanceDtos.Count(a => a.IsPresent || a.Status == AttendanceStatus.Present);
        var totalAbsent = attendanceDtos.Count(a => a.Status == AttendanceStatus.Absent || a.Status == AttendanceStatus.Sick || a.Status == AttendanceStatus.ExcusedAbsence);

        return new DailyReportResponse
        {
            Date = date,
            ClassroomId = classroomId,
            ClassroomName = classroomName,
            TotalChildren = consolidatedChildren.Count,
            TotalPresent = totalPresent,
            TotalAbsent = totalAbsent,
            TotalMeals = mealDtos.Count,
            TotalActivities = activityDtos.Count,
            Attendance = attendanceDtos,
            Meals = mealDtos,
            Activities = activityDtos,
            Children = consolidatedChildren
        };
    }
}
