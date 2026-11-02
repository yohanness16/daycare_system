using Daycare.Application.DTOs.Parent;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Parent;

public interface IGetParentChildrenService
{
    Task<IReadOnlyList<ParentChildCardResponse>> ExecuteAsync(CancellationToken cancellationToken = default);
}

public class GetParentChildrenService : IGetParentChildrenService
{
    private readonly IParentAccessService _parentAccessService;
    private readonly IDaycareDbContext _db;

    public GetParentChildrenService(IParentAccessService parentAccessService, IDaycareDbContext db)
    {
        _parentAccessService = parentAccessService;
        _db = db;
    }

    public async Task<IReadOnlyList<ParentChildCardResponse>> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var children = await _parentAccessService.OwnChildren()
            .OrderBy(c => c.FirstName)
            .ThenBy(c => c.LastName)
            .ToListAsync(cancellationToken);

        if (children.Count == 0)
        {
            return Array.Empty<ParentChildCardResponse>();
        }

        var childIds = children.Select(c => c.Id).ToList();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var now = DateTime.UtcNow;

        // Fetch active enrollments with Classrooms
        var activeEnrollments = await _db.Enrollments
            .Include(e => e.Classroom)
            .Where(e => childIds.Contains(e.ChildId) &&
                        e.Status == EnrollmentStatus.Active &&
                        (e.EndDate == null || e.EndDate > now))
            .ToListAsync(cancellationToken);

        var classroomIds = activeEnrollments.Select(e => e.ClassroomId).Distinct().ToList();

        // Fetch active teachers for these classrooms
        var classroomTeachers = await _db.ClassroomStaff
            .Include(cs => cs.Staff)
            .Where(cs => classroomIds.Contains(cs.ClassroomId) &&
                         (cs.EndedAt == null || cs.EndedAt > now))
            .ToListAsync(cancellationToken);

        // Fetch today's attendances
        var attendances = await _db.Attendances
            .Where(a => childIds.Contains(a.ChildId) && a.Date == today)
            .ToListAsync(cancellationToken);

        // Fetch today's activities
        var todayActivities = await _db.DailyActivities
            .Where(da => childIds.Contains(da.ChildId) &&
                         da.StartTime >= now.Date && da.StartTime < now.Date.AddDays(1))
            .OrderByDescending(da => da.StartTime)
            .ToListAsync(cancellationToken);

        // Fetch today's meals
        var todayMeals = await _db.Meals
            .Where(m => childIds.Contains(m.ChildId) &&
                        m.MealTime >= now.Date && m.MealTime < now.Date.AddDays(1))
            .OrderByDescending(m => m.MealTime)
            .ToListAsync(cancellationToken);

        var responseList = new List<ParentChildCardResponse>(children.Count);

        foreach (var child in children)
        {
            var enrollment = activeEnrollments.FirstOrDefault(e => e.ChildId == child.Id);
            ParentClassroomSummary? classroomSummary = null;
            var primaryTeachers = new List<ParentTeacherSummary>();

            if (enrollment != null)
            {
                classroomSummary = new ParentClassroomSummary
                {
                    Id = enrollment.ClassroomId,
                    Name = enrollment.Classroom.Name
                };

                primaryTeachers = classroomTeachers
                    .Where(ct => ct.ClassroomId == enrollment.ClassroomId)
                    .Select(ct => new ParentTeacherSummary
                    {
                        StaffId = ct.StaffId,
                        Name = $"{ct.Staff.FirstName} {ct.Staff.LastName}".Trim(),
                        PhotoUrl = ct.Staff.PhotoUrl
                    })
                    .ToList();
            }

            var attendance = attendances.FirstOrDefault(a => a.ChildId == child.Id);
            var latestActivity = todayActivities.FirstOrDefault(a => a.ChildId == child.Id);
            var latestMeal = todayMeals.FirstOrDefault(m => m.ChildId == child.Id);

            var todaySummary = new ParentChildTodaySummary
            {
                Status = attendance?.Status ?? AttendanceStatus.NotArrived,
                ArrivalTime = attendance?.ArrivalTime,
                DepartureTime = attendance?.DepartureTime,
                Mood = attendance?.Mood != null ? (int?)attendance.Mood : null,
                CurrentActivity = latestActivity != null
                    ? new ParentActivitySummary
                    {
                        Type = (int)latestActivity.ActivityType,
                        Description = latestActivity.ActivityDescription,
                        StartedAt = latestActivity.StartTime,
                        IsInProgress = latestActivity.EndTime == null || latestActivity.EndTime > now
                    }
                    : null,
                LastMeal = latestMeal != null
                    ? new ParentMealSummary
                    {
                        Type = (int)latestMeal.Type,
                        Status = (int)latestMeal.Status,
                        MealTime = latestMeal.MealTime
                    }
                    : null,
                LatestHealthAlert = null,
                UnreadMessages = 0,
                PendingAcknowledgements = 0
            };

            var months = (today.Year - child.DateOfBirth.Year) * 12 + today.Month - child.DateOfBirth.Month;
            if (today.Day < child.DateOfBirth.Day) months--;
            var ageMonths = Math.Max(0, months);

            responseList.Add(new ParentChildCardResponse
            {
                ChildId = child.Id,
                FirstName = child.FirstName,
                LastName = child.LastName,
                PhotoUrl = child.PhotoUrl,
                AgeMonths = ageMonths,
                Classroom = classroomSummary,
                PrimaryTeachers = primaryTeachers,
                Today = todaySummary
            });
        }

        return responseList;
    }
}
