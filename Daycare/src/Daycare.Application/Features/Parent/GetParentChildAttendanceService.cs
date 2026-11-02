using Daycare.Application.DTOs.Parent;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Parent;

public interface IGetParentChildAttendanceService
{
    Task<IReadOnlyList<ParentChildAttendanceResponse>> ExecuteAsync(
        Guid childId,
        DateOnly? from = null,
        DateOnly? to = null,
        CancellationToken cancellationToken = default);
}

public class GetParentChildAttendanceService : IGetParentChildAttendanceService
{
    private readonly IParentAccessService _parentAccessService;
    private readonly IDaycareDbContext _db;

    public GetParentChildAttendanceService(IParentAccessService parentAccessService, IDaycareDbContext db)
    {
        _parentAccessService = parentAccessService;
        _db = db;
    }

    public async Task<IReadOnlyList<ParentChildAttendanceResponse>> ExecuteAsync(
        Guid childId,
        DateOnly? from = null,
        DateOnly? to = null,
        CancellationToken cancellationToken = default)
    {
        var owns = await _parentAccessService.OwnsChildAsync(childId, cancellationToken);
        if (!owns)
        {
            throw new KeyNotFoundException($"Child with ID '{childId}' was not found.");
        }

        var query = _db.Attendances
            .Where(a => a.ChildId == childId);

        if (from.HasValue)
        {
            query = query.Where(a => a.Date >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(a => a.Date <= to.Value);
        }

        var attendances = await query
            .OrderByDescending(a => a.Date)
            .ThenByDescending(a => a.ArrivalTime)
            .ToListAsync(cancellationToken);

        return attendances.Select(a =>
        {
            int? durationMinutes = null;
            if (a.ArrivalTime.HasValue && a.DepartureTime.HasValue && a.DepartureTime.Value >= a.ArrivalTime.Value)
            {
                durationMinutes = (int)(a.DepartureTime.Value - a.ArrivalTime.Value).TotalMinutes;
            }

            return new ParentChildAttendanceResponse
            {
                Id = a.Id,
                Date = a.Date,
                ArrivalTime = a.ArrivalTime,
                DepartureTime = a.DepartureTime,
                Status = a.Status,
                DurationMinutes = durationMinutes,
                PickedUpBy = a.PickedUpBy,
                Note = a.Note,
                Mood = a.Mood
            };
        }).ToList();
    }
}
