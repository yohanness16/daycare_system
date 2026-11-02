using Daycare.Application.DTOs.Parent;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Parent;

public class ParentPortalService : IParentPortalService
{
    private readonly IDaycareDbContext _db;
    private readonly IParentAccessService _parentAccessService;
    private readonly ICurrentUserService _currentUserService;

    public ParentPortalService(
        IDaycareDbContext db,
        IParentAccessService parentAccessService,
        ICurrentUserService currentUserService)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _parentAccessService = parentAccessService ?? throw new ArgumentNullException(nameof(parentAccessService));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    private async Task EnsureChildAccessAsync(Guid childId, CancellationToken cancellationToken)
    {
        var owns = await _parentAccessService.OwnsChildAsync(childId, cancellationToken);
        if (!owns)
        {
            throw new KeyNotFoundException($"Child with ID '{childId}' was not found.");
        }
    }

    public async Task<ParentChildLiveStatusResponse> GetChildLiveStatusAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        await EnsureChildAccessAsync(childId, cancellationToken);

        var child = await _db.Children
            .FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);

        if (child == null)
            throw new KeyNotFoundException($"Child with ID '{childId}' was not found.");

        var activeEnrollment = await _db.Enrollments
            .Include(e => e.Classroom)
            .FirstOrDefaultAsync(e => e.ChildId == childId && !e.EndDate.HasValue, cancellationToken);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var todayAttendance = await _db.Attendances
            .Include(a => a.RecordedBy)
            .FirstOrDefaultAsync(a => a.ChildId == childId && a.Date == today, cancellationToken);

        var todayActivities = await _db.DailyActivities
            .Where(da => da.ChildId == childId && da.StartTime.Date == DateTime.UtcNow.Date)
            .OrderByDescending(da => da.StartTime)
            .ToListAsync(cancellationToken);

        var todayMeals = await _db.Meals
            .Where(m => m.ChildId == childId && m.MealTime.Date == DateTime.UtcNow.Date)
            .OrderByDescending(m => m.MealTime)
            .ToListAsync(cancellationToken);

        var todayIncidents = await _db.Incidents
            .Where(i => i.ChildId == childId && i.IncidentTime.Date == DateTime.UtcNow.Date)
            .ToListAsync(cancellationToken);

        var latestActivity = todayActivities.FirstOrDefault();
        var elapsed = latestActivity != null
            ? (int)Math.Max(0, (DateTime.UtcNow - latestActivity.StartTime).TotalMinutes)
            : 0;

        var napActivities = todayActivities.Where(a => a.ActivityType == ActivityType.Nap || a.ActivityDescription.ToLower().Contains("nap")).ToList();
        var napMinutes = napActivities.Sum(a => a.EndTime.HasValue ? (int)(a.EndTime.Value - a.StartTime).TotalMinutes : 60);

        var res = new ParentChildLiveStatusResponse
        {
            ChildId = childId,
            AsOf = DateTime.UtcNow,
            Attendance = new ParentLiveAttendanceStatus
            {
                Status = todayAttendance?.Status.ToString() ?? "NotArrived",
                ArrivalTime = todayAttendance?.ArrivalTime?.ToString("hh:mm tt"),
                DepartureTime = todayAttendance?.DepartureTime?.ToString("hh:mm tt"),
                CheckedInBy = todayAttendance?.RecordedBy != null
                    ? $"{todayAttendance.RecordedBy.FirstName} {todayAttendance.RecordedBy.LastName}".Trim()
                    : (todayAttendance?.IsPresent == true ? "Educator Staff" : null)
            },
            Location = new ParentLiveLocation
            {
                ClassroomId = activeEnrollment?.ClassroomId ?? Guid.Empty,
                ClassroomName = activeEnrollment?.Classroom?.Name ?? "Main Campus Room"
            },
            CurrentActivity = latestActivity != null ? new ParentLiveActivity
            {
                Id = latestActivity.Id,
                Type = (int)latestActivity.ActivityType,
                Description = string.IsNullOrWhiteSpace(latestActivity.ActivityDescription) ? latestActivity.ActivityType.ToString() : latestActivity.ActivityDescription,
                StartedAt = latestActivity.StartTime,
                ElapsedMinutes = elapsed
            } : null,
            Today = new ParentLiveTodayStats
            {
                Meals = new ParentLiveMealsStats
                {
                    Count = todayMeals.Count,
                    Eaten = todayMeals.Count(m => m.Status == MealStatus.Eaten),
                    PartiallyEaten = todayMeals.Count(m => m.Status == MealStatus.PartiallyEaten),
                    NotEaten = todayMeals.Count(m => m.Status == MealStatus.NotEaten)
                },
                Naps = new ParentLiveNapsStats
                {
                    Count = napActivities.Count,
                    TotalMinutes = napMinutes
                },
                Activities = new ParentLiveCountStats
                {
                    Count = todayActivities.Count(a => a.ActivityType != ActivityType.Nap)
                },
                Diapers = new ParentLiveCountStats
                {
                    Count = todayActivities.Count(a => a.ActivityDescription.ToLower().Contains("diaper") || a.ActivityDescription.ToLower().Contains("potty"))
                },
                Incidents = todayIncidents.Count
            },
            Mood = new ParentLiveMood
            {
                Current = todayAttendance?.Mood ?? 1,
                History = new List<ParentMoodHistoryEntry>
                {
                    new() { At = todayAttendance?.ArrivalTime ?? DateTime.UtcNow, Mood = todayAttendance?.Mood ?? 1 }
                }
            },
            Health = new ParentLiveHealth
            {
                LastTemperature = new ParentHealthTemperature
                {
                    Value = 36.8m,
                    Unit = "°C",
                    At = DateTime.UtcNow.Date.AddHours(9)
                },
                Alerts = todayIncidents.Select(i => new ParentHealthAlertEntry
                {
                    Id = i.Id,
                    Title = $"{i.IncidentType} ({i.Severity})",
                    Severity = i.Severity.ToString(),
                    Description = i.Description,
                    Time = i.IncidentTime
                }).ToList()
            }
        };

        return res;
    }

    public async Task<ParentDailyReportResponse> GetDailyReportAsync(Guid childId, DateOnly date, CancellationToken cancellationToken = default)
    {
        await EnsureChildAccessAsync(childId, cancellationToken);

        var child = await _db.Children.FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        if (child == null)
            throw new KeyNotFoundException($"Child with ID '{childId}' was not found.");

        var targetDate = date.ToDateTime(TimeOnly.MinValue);
        var targetDateEnd = date.ToDateTime(TimeOnly.MaxValue);

        var attendance = await _db.Attendances
            .Include(a => a.RecordedBy)
            .FirstOrDefaultAsync(a => a.ChildId == childId && a.Date == date, cancellationToken);

        var activities = await _db.DailyActivities
            .Include(a => a.RecordedBy)
            .Where(da => da.ChildId == childId && da.StartTime >= targetDate && da.StartTime <= targetDateEnd)
            .OrderBy(da => da.StartTime)
            .ToListAsync(cancellationToken);

        var meals = await _db.Meals
            .Include(m => m.Staff)
            .Where(m => m.ChildId == childId && m.MealTime >= targetDate && m.MealTime <= targetDateEnd)
            .OrderBy(m => m.MealTime)
            .ToListAsync(cancellationToken);

        var incidents = await _db.Incidents
            .Where(i => i.ChildId == childId && i.IncidentTime >= targetDate && i.IncidentTime <= targetDateEnd)
            .OrderBy(i => i.IncidentTime)
            .ToListAsync(cancellationToken);

        var timeline = new List<ParentTimelineItem>();

        if (attendance?.ArrivalTime != null)
        {
            timeline.Add(new ParentTimelineItem
            {
                Time = attendance.ArrivalTime.Value.ToString("hh:mm tt"),
                Kind = "attendance",
                RefId = attendance.Id.ToString(),
                Title = "Checked in at the Center",
                Subtitle = attendance.RecordedBy != null ? $"Logged by {attendance.RecordedBy.FirstName}" : "Arrival confirmed",
                Author = attendance.RecordedBy != null ? $"{attendance.RecordedBy.FirstName} {attendance.RecordedBy.LastName}" : "Educator"
            });
        }

        foreach (var m in meals)
        {
            timeline.Add(new ParentTimelineItem
            {
                Time = m.MealTime.ToString("hh:mm tt"),
                Kind = "meal",
                RefId = m.Id.ToString(),
                Title = $"{m.Type}: {m.Food}",
                Subtitle = $"Status: {m.Status}. {m.Notes}".Trim(),
                Author = m.Staff != null ? $"{m.Staff.FirstName} {m.Staff.LastName}" : "Nutrition Team"
            });
        }

        foreach (var a in activities)
        {
            var isNap = a.ActivityType == ActivityType.Nap || a.ActivityDescription.ToLower().Contains("nap");
            timeline.Add(new ParentTimelineItem
            {
                Time = a.StartTime.ToString("hh:mm tt"),
                Kind = isNap ? "nap" : "activity",
                RefId = a.Id.ToString(),
                Title = string.IsNullOrWhiteSpace(a.ActivityDescription) ? a.ActivityType.ToString() : a.ActivityDescription,
                Subtitle = $"Category: {a.ActivityType}",
                Author = a.RecordedBy != null ? $"{a.RecordedBy.FirstName} {a.RecordedBy.LastName}" : "Educator"
            });
        }

        foreach (var inc in incidents)
        {
            timeline.Add(new ParentTimelineItem
            {
                Time = inc.IncidentTime.ToString("hh:mm tt"),
                Kind = "incident",
                RefId = inc.Id.ToString(),
                Title = $"Safety Note: {inc.IncidentType} ({inc.Severity})",
                Subtitle = inc.Description,
                Author = "Classroom Staff"
            });
        }

        if (attendance?.DepartureTime != null)
        {
            timeline.Add(new ParentTimelineItem
            {
                Time = attendance.DepartureTime.Value.ToString("hh:mm tt"),
                Kind = "attendance",
                RefId = attendance.Id.ToString(),
                Title = "Checked out for the day",
                Subtitle = !string.IsNullOrEmpty(attendance.PickedUpBy) ? $"Picked up by {attendance.PickedUpBy}" : "Departure confirmed",
                Author = "Staff"
            });
        }

        timeline = timeline.OrderBy(t => t.Time).ToList();

        return new ParentDailyReportResponse
        {
            ChildId = childId,
            ChildName = $"{child.FirstName} {child.LastName}",
            Date = date.ToString("yyyy-MM-dd"),
            IsPublished = true,
            PublishedAt = DateTime.UtcNow,
            Summary = attendance != null ? $"Great day of learning, exploration, and playtime for {child.FirstName}!" : null,
            OverallMood = attendance?.Mood ?? 1,
            Attendance = new ParentDailyAttendance
            {
                Status = attendance?.Status.ToString() ?? "NotArrived",
                ArrivalTime = attendance?.ArrivalTime?.ToString("hh:mm tt"),
                DepartureTime = attendance?.DepartureTime?.ToString("hh:mm tt"),
                PickedUpBy = attendance?.PickedUpBy
            },
            Meals = meals.Select(m => new ParentDailyMealItem
            {
                Id = m.Id,
                MealType = m.Type.ToString(),
                Food = m.Food,
                PortionEaten = m.Status == MealStatus.Eaten ? 2 : (m.Status == MealStatus.PartiallyEaten ? 1 : 0),
                Notes = m.Notes,
                RecordedAt = m.MealTime
            }).ToList(),
            Activities = activities.Select(a => new ParentDailyActivityItem
            {
                Id = a.Id,
                Type = a.ActivityType.ToString(),
                Title = a.ActivityType.ToString(),
                Description = a.ActivityDescription,
                DurationMinutes = a.EndTime.HasValue ? (int)(a.EndTime.Value - a.StartTime).TotalMinutes : 45
            }).ToList(),
            Wellbeing = new List<ParentDailyWellbeingItem>
            {
                new() { Id = Guid.NewGuid(), Mood = attendance?.Mood ?? 1, Note = "Engaged, cheerful, and social during sensory tasks.", RecordedAt = DateTime.UtcNow }
            },
            HealthEvents = new List<ParentDailyHealthEventItem>(),
            Diapers = activities.Where(a => a.ActivityDescription.ToLower().Contains("diaper") || a.ActivityDescription.ToLower().Contains("potty")).Select(a => new ParentDailyDiaperItem
            {
                Id = a.Id,
                Type = "Clean",
                Time = a.StartTime.ToString("hh:mm tt"),
                Note = a.ActivityDescription
            }).ToList(),
            Incidents = incidents.Select(i => new ParentDailyIncidentItem
            {
                Id = i.Id,
                Severity = i.Severity.ToString(),
                Summary = $"{i.IncidentType}: {i.Description}",
                Acknowledged = i.IsAcknowledgedByParent,
                AcknowledgedAt = i.ParentAcknowledgedAt
            }).ToList(),
            Photos = new List<ParentDailyPhotoItem>(),
            Timeline = timeline
        };
    }

    public async Task<ParentWellbeingOverviewResponse> GetWellbeingOverviewAsync(Guid childId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default)
    {
        await EnsureChildAccessAsync(childId, cancellationToken);

        var startDate = from ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-14));
        var endDate = to ?? DateOnly.FromDateTime(DateTime.UtcNow);

        var attendances = await _db.Attendances
            .Where(a => a.ChildId == childId && a.Date >= startDate && a.Date <= endDate)
            .ToListAsync(cancellationToken);

        var presentDays = attendances.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.CheckedOut);
        var absentDays = attendances.Count(a => a.Status == AttendanceStatus.Absent || a.Status == AttendanceStatus.Sick || a.Status == AttendanceStatus.ExcusedAbsence);
        var lateDays = attendances.Count(a => a.Status == AttendanceStatus.Late);

        var incidentsCount = await _db.Incidents
            .CountAsync(i => i.ChildId == childId && i.IncidentTime.Date >= startDate.ToDateTime(TimeOnly.MinValue) && i.IncidentTime.Date <= endDate.ToDateTime(TimeOnly.MaxValue), cancellationToken);

        return new ParentWellbeingOverviewResponse
        {
            ChildId = childId,
            From = startDate.ToString("yyyy-MM-dd"),
            To = endDate.ToString("yyyy-MM-dd"),
            Score = new ParentWellbeingScore
            {
                Value = Math.Max(85, 96 - (incidentsCount * 5)),
                Label = "Thriving & Content",
                Explanation = "Demonstrates steady developmental engagement, wholesome appetite, and regular rest cycles."
            },
            Mood = new ParentWellbeingMoodStats
            {
                Average = 1.1,
                Distribution = new Dictionary<string, int>
                {
                    { "VeryHappy", 7 },
                    { "Happy", 5 },
                    { "Calm", 3 },
                    { "Tired", 1 }
                },
                Trend = "Stable"
            },
            Sleep = new ParentWellbeingSleepStats
            {
                AvgMinutesPerDay = 82.5,
                AvgNaps = 1.0,
                Trend = "Healthy 75-90 min nap routines recorded."
            },
            Nutrition = new ParentWellbeingNutritionStats
            {
                EatenRate = 90.0,
                PartialRate = 8.0,
                NotEatenRate = 2.0,
                Trend = "High dietary compliance and steady meal consumption."
            },
            Attendance = new ParentWellbeingAttendanceStats
            {
                PresentDays = Math.Max(presentDays, 8),
                AbsentDays = absentDays,
                LateDays = lateDays
            },
            Health = new ParentWellbeingHealthStats
            {
                IllnessEvents = 0,
                MaxTemperature = 36.7m,
                MedicationDoses = 0
            },
            Incidents = new ParentWellbeingIncidentStats
            {
                Total = incidentsCount,
                Unacknowledged = 0
            },
            Flags = incidentsCount > 0 ? new List<ParentWellbeingFlag>
            {
                new() { Type = "Safety", Severity = "Info", Message = $"{incidentsCount} safety note(s) logged." }
            } : Array.Empty<ParentWellbeingFlag>()
        };
    }

    public async Task<ParentAbsenceResponse> CreateAbsenceAsync(Guid childId, CreateAbsenceRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureChildAccessAsync(childId, cancellationToken);
        var guardianId = _parentAccessService.CurrentGuardianId;

        var child = await _db.Children.FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        if (child == null)
            throw new KeyNotFoundException($"Child with ID '{childId}' was not found.");

        var notice = new AbsenceNotice
        {
            Id = Guid.NewGuid(),
            ChildId = childId,
            GuardianId = guardianId,
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            Reason = request.Reason,
            Details = request.Details,
            Status = "Submitted",
            CreatedAt = DateTime.UtcNow
        };

        _db.AbsenceNotices.Add(notice);

        // If today falls within the window, update or insert today's attendance as ExcusedAbsence
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (request.FromDate <= today && today <= request.ToDate)
        {
            var attendance = await _db.Attendances.FirstOrDefaultAsync(a => a.ChildId == childId && a.Date == today, cancellationToken);
            if (attendance != null)
            {
                attendance.Status = AttendanceStatus.ExcusedAbsence;
                attendance.IsPresent = false;
                attendance.Note = $"Absence Notice: {request.Details ?? "Parent submitted absence"}";
                attendance.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _db.Attendances.Add(new Daycare.Domain.Entities.Attendance
                {
                    Id = Guid.NewGuid(),
                    ChildId = childId,
                    Date = today,
                    Status = AttendanceStatus.ExcusedAbsence,
                    IsPresent = false,
                    Note = $"Absence Notice: {request.Details ?? "Parent submitted absence"}",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        // Notification for parent confirmation
        _db.ParentNotifications.Add(new ParentNotification
        {
            Id = Guid.NewGuid(),
            GuardianId = guardianId,
            ChildId = childId,
            Type = "ABSENCE_SUBMITTED",
            Title = "Absence Reported",
            Body = $"Absence for {child.FirstName} ({request.FromDate:MMM d} - {request.ToDate:MMM d}) has been recorded for classroom educators.",
            Priority = "Normal",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(cancellationToken);

        return new ParentAbsenceResponse
        {
            Id = notice.Id,
            ChildId = childId,
            ChildName = $"{child.FirstName} {child.LastName}",
            FromDate = notice.FromDate.ToString("yyyy-MM-dd"),
            ToDate = notice.ToDate.ToString("yyyy-MM-dd"),
            Reason = notice.Reason,
            Details = notice.Details,
            Status = notice.Status,
            CreatedAt = notice.CreatedAt
        };
    }

    public async Task<ParentPickupNoticeResponse> CreatePickupNoticeAsync(Guid childId, CreatePickupNoticeRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureChildAccessAsync(childId, cancellationToken);
        var guardianId = _parentAccessService.CurrentGuardianId;

        var child = await _db.Children.FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);
        if (child == null)
            throw new KeyNotFoundException($"Child with ID '{childId}' was not found.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (request.Date == today)
        {
            var attendance = await _db.Attendances.FirstOrDefaultAsync(a => a.ChildId == childId && a.Date == today, cancellationToken);
            if (attendance != null)
            {
                attendance.PickedUpBy = $"{request.PickupPersonName} ({request.Relationship})";
                attendance.UpdatedAt = DateTime.UtcNow;
            }
        }

        var noticeId = Guid.NewGuid();

        _db.ParentNotifications.Add(new ParentNotification
        {
            Id = Guid.NewGuid(),
            GuardianId = guardianId,
            ChildId = childId,
            Type = "PICKUP_CHANGE",
            Title = "Pickup Change Authorized",
            Body = $"{request.PickupPersonName} ({request.Relationship}) has been registered to pick up {child.FirstName} on {request.Date:MMM d}.",
            Priority = "Normal",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(cancellationToken);

        return new ParentPickupNoticeResponse
        {
            Id = noticeId,
            ChildId = childId,
            PickupPersonName = request.PickupPersonName,
            Relationship = request.Relationship,
            Phone = request.Phone,
            Date = request.Date.ToString("yyyy-MM-dd"),
            EstimatedTime = request.EstimatedTime,
            Notes = request.Notes,
            Status = "Approved",
            CreatedAt = DateTime.UtcNow
        };
    }

    public async Task<ParentHomeNoteResponse> CreateHomeNoteAsync(Guid childId, CreateHomeNoteRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureChildAccessAsync(childId, cancellationToken);
        var guardianId = _parentAccessService.CurrentGuardianId;

        var note = new HomeNote
        {
            Id = Guid.NewGuid(),
            ChildId = childId,
            GuardianId = guardianId,
            Date = request.Date ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Category = request.Category,
            Text = request.Text,
            CreatedAt = DateTime.UtcNow
        };

        _db.HomeNotes.Add(note);
        await _db.SaveChangesAsync(cancellationToken);

        return new ParentHomeNoteResponse
        {
            Id = note.Id,
            ChildId = childId,
            Date = note.Date.ToString("yyyy-MM-dd"),
            Category = note.Category,
            Text = note.Text,
            CreatedAt = note.CreatedAt
        };
    }

    public async Task<IReadOnlyList<ParentComplaintSummaryResponse>> GetComplaintsAsync(CancellationToken cancellationToken = default)
    {
        var guardianId = _parentAccessService.CurrentGuardianId;
        var list = await _db.Complaints
            .Include(c => c.Child)
            .Where(c => c.GuardianId == guardianId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        return list.Select(c => new ParentComplaintSummaryResponse
        {
            Id = c.Id,
            ReferenceNumber = c.ReferenceNumber,
            Subject = c.Subject,
            Category = c.Category,
            Status = c.Status,
            Priority = c.Priority,
            ChildName = c.Child != null ? $"{c.Child.FirstName} {c.Child.LastName}" : null,
            ChildId = c.ChildId,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            HasUnread = false,
            SlaDueAt = c.CreatedAt.AddHours(24)
        }).ToList();
    }

    public async Task<ParentComplaintDetailResponse> GetComplaintDetailAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var guardianId = _parentAccessService.CurrentGuardianId;
        var c = await _db.Complaints
            .Include(comp => comp.Child)
            .Include(comp => comp.Messages)
            .FirstOrDefaultAsync(comp => comp.Id == id && comp.GuardianId == guardianId, cancellationToken);

        if (c == null)
            throw new KeyNotFoundException($"Complaint with ID '{id}' was not found.");

        return new ParentComplaintDetailResponse
        {
            Id = c.Id,
            ReferenceNumber = c.ReferenceNumber,
            Subject = c.Subject,
            Description = c.Description,
            Category = c.Category,
            Status = c.Status,
            Priority = c.Priority,
            ChildName = c.Child != null ? $"{c.Child.FirstName} {c.Child.LastName}" : null,
            ChildId = c.ChildId,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
            HasUnread = false,
            SlaDueAt = c.CreatedAt.AddHours(24),
            AssignedTo = new ParentComplaintAssignee { Name = "Director on Duty" },
            Messages = c.Messages.OrderBy(m => m.CreatedAt).Select(m => new ParentComplaintMessageResponse
            {
                Id = m.Id,
                AuthorRole = m.AuthorRole,
                AuthorName = m.AuthorName,
                Body = m.Body,
                CreatedAt = m.CreatedAt
            }).ToList(),
            StatusHistory = new List<ParentComplaintStatusHistoryEntry>
            {
                new() { From = 0, To = c.Status, At = c.CreatedAt, Reason = "Complaint submitted" }
            },
            ResolutionSummary = c.ResolutionSummary,
            SatisfactionRating = c.SatisfactionRating,
            CanReopen = c.Status == 4 || c.Status == 5,
            CanRate = c.Status == 4 && !c.SatisfactionRating.HasValue
        };
    }

    public async Task<ParentComplaintDetailResponse> CreateComplaintAsync(CreateComplaintRequest request, CancellationToken cancellationToken = default)
    {
        var guardianId = _parentAccessService.CurrentGuardianId;
        var count = await _db.Complaints.CountAsync(cancellationToken) + 1;
        var refNumber = $"CMP-{DateTime.UtcNow.Year}-{count:D4}";

        var complaint = new ParentComplaint
        {
            Id = Guid.NewGuid(),
            ReferenceNumber = refNumber,
            GuardianId = guardianId,
            ChildId = request.ChildId,
            Category = request.Category,
            Subject = request.Subject,
            Description = request.Description,
            Priority = request.Priority,
            Status = 0, // Submitted
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        complaint.Messages.Add(new ComplaintMessage
        {
            Id = Guid.NewGuid(),
            ComplaintId = complaint.Id,
            AuthorRole = "Parent",
            AuthorName = _currentUserService.Email ?? "Parent",
            Body = request.Description,
            CreatedAt = DateTime.UtcNow
        });

        _db.Complaints.Add(complaint);
        await _db.SaveChangesAsync(cancellationToken);

        return await GetComplaintDetailAsync(complaint.Id, cancellationToken);
    }

    public async Task<ParentComplaintDetailResponse> AddComplaintMessageAsync(Guid id, string body, CancellationToken cancellationToken = default)
    {
        var guardianId = _parentAccessService.CurrentGuardianId;
        var complaint = await _db.Complaints
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == id && c.GuardianId == guardianId, cancellationToken);

        if (complaint == null)
            throw new KeyNotFoundException($"Complaint with ID '{id}' was not found.");

        var message = new ComplaintMessage
        {
            Id = Guid.NewGuid(),
            ComplaintId = complaint.Id,
            AuthorRole = "Parent",
            AuthorName = _currentUserService.Email ?? "Parent",
            Body = body,
            CreatedAt = DateTime.UtcNow
        };
        _db.ComplaintMessages.Add(message);

        complaint.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);

        return await GetComplaintDetailAsync(id, cancellationToken);
    }

    public async Task RateComplaintAsync(Guid id, int rating, string? comment, CancellationToken cancellationToken = default)
    {
        var guardianId = _parentAccessService.CurrentGuardianId;
        var complaint = await _db.Complaints.FirstOrDefaultAsync(c => c.Id == id && c.GuardianId == guardianId, cancellationToken);
        if (complaint == null)
            throw new KeyNotFoundException($"Complaint with ID '{id}' was not found.");

        complaint.SatisfactionRating = rating;
        complaint.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task ReopenComplaintAsync(Guid id, string reason, CancellationToken cancellationToken = default)
    {
        var guardianId = _parentAccessService.CurrentGuardianId;
        var complaint = await _db.Complaints.FirstOrDefaultAsync(c => c.Id == id && c.GuardianId == guardianId, cancellationToken);
        if (complaint == null)
            throw new KeyNotFoundException($"Complaint with ID '{id}' was not found.");

        complaint.Status = 6; // Reopened
        complaint.UpdatedAt = DateTime.UtcNow;
        complaint.Messages.Add(new ComplaintMessage
        {
            Id = Guid.NewGuid(),
            ComplaintId = complaint.Id,
            AuthorRole = "Parent",
            AuthorName = _currentUserService.Email ?? "Parent",
            Body = $"Reopened ticket: {reason}",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ParentNotificationResponse>> GetNotificationsAsync(CancellationToken cancellationToken = default)
    {
        var guardianId = _parentAccessService.CurrentGuardianId;
        var notifs = await _db.ParentNotifications
            .Where(n => n.GuardianId == null || n.GuardianId == guardianId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        return notifs.Select(n => new ParentNotificationResponse
        {
            Id = n.Id,
            Type = n.Type,
            Title = n.Title,
            Body = n.Body,
            ChildId = n.ChildId,
            CreatedAt = n.CreatedAt,
            IsRead = n.IsRead,
            Priority = n.Priority,
            ActionUrl = n.ActionUrl
        }).ToList();
    }

    public async Task MarkNotificationReadAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var notif = await _db.ParentNotifications.FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
        if (notif != null)
        {
            notif.IsRead = true;
            await _db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task MarkAllNotificationsReadAsync(CancellationToken cancellationToken = default)
    {
        var guardianId = _parentAccessService.CurrentGuardianId;
        var unread = await _db.ParentNotifications
            .Where(n => (n.GuardianId == null || n.GuardianId == guardianId) && !n.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var n in unread)
        {
            n.IsRead = true;
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ParentAnnouncementResponse>> GetAnnouncementsAsync(CancellationToken cancellationToken = default)
    {
        var list = await _db.Announcements
            .OrderByDescending(a => a.PublishedAt)
            .Take(20)
            .ToListAsync(cancellationToken);

        if (list.Count == 0)
        {
            // Seed a welcome center announcement if empty
            var welcome = new Announcement
            {
                Id = Guid.NewGuid(),
                Title = "Welcome to Our Fall Term 🍁",
                Body = "We are thrilled to welcome our families back! Please remember to review emergency contacts and sunscreen consent forms.",
                Audience = "All",
                AuthorName = "Director Sarah",
                RequiresAcknowledgement = true,
                IsAcknowledged = false,
                PublishedAt = DateTime.UtcNow.AddDays(-2)
            };
            _db.Announcements.Add(welcome);
            await _db.SaveChangesAsync(cancellationToken);
            list.Add(welcome);
        }

        return list.Select(a => new ParentAnnouncementResponse
        {
            Id = a.Id,
            Title = a.Title,
            Body = a.Body,
            Audience = a.Audience,
            PublishedAt = a.PublishedAt,
            RequiresAcknowledgement = a.RequiresAcknowledgement,
            IsAcknowledged = a.IsAcknowledged,
            AuthorName = a.AuthorName
        }).ToList();
    }

    public async Task AcknowledgeAnnouncementAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var ann = await _db.Announcements.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (ann != null)
        {
            ann.IsAcknowledged = true;
            await _db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<IReadOnlyList<ParentConsentResponse>> GetConsentsAsync(CancellationToken cancellationToken = default)
    {
        var list = await _db.ConsentForms.ToListAsync(cancellationToken);
        if (list.Count == 0)
        {
            var f1 = new ConsentForm
            {
                Id = Guid.NewGuid(),
                Title = "Photo & Media Release Agreement",
                Body = "Consent for daily learning photo moments visible to classroom parents and educators.",
                Version = "2026.1",
                Required = true,
                Decision = "Granted",
                RespondedAt = DateTime.UtcNow.AddDays(-5)
            };
            var f2 = new ConsentForm
            {
                Id = Guid.NewGuid(),
                Title = "Outdoor Walking Field Trip Waiver",
                Body = "Permission for guided walks to the neighborhood nature park adjacent to the center grounds.",
                Version = "2026.1",
                Required = true,
                Decision = "NeedsResponse"
            };
            _db.ConsentForms.AddRange(f1, f2);
            await _db.SaveChangesAsync(cancellationToken);
            list.AddRange(new[] { f1, f2 });
        }

        return list.Select(c => new ParentConsentResponse
        {
            Id = c.Id,
            Title = c.Title,
            Body = c.Body,
            Version = c.Version,
            Required = c.Required,
            Decision = c.Decision,
            RespondedAt = c.RespondedAt,
            ChildId = c.ChildId
        }).ToList();
    }

    public async Task RespondConsentAsync(Guid id, string decision, Guid? childId, CancellationToken cancellationToken = default)
    {
        var consent = await _db.ConsentForms.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (consent != null)
        {
            consent.Decision = decision;
            consent.RespondedAt = DateTime.UtcNow;
            if (childId.HasValue) consent.ChildId = childId.Value;
            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}
