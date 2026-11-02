using Daycare.Application.Common;
using Daycare.Application.DTOs.Incidents;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Incidents;

public class IncidentService : IIncidentService
{
    private readonly IDaycareDbContext _db;
    private readonly ICurrentUserService _currentUserService;

    public IncidentService(IDaycareDbContext db, ICurrentUserService currentUserService)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    public async Task<IncidentResponse> CreateAsync(
        CreateIncidentRequest request,
        Guid currentUserId,
        CancellationToken cancellationToken = default)
    {
        var child = await _db.Children
            .FirstOrDefaultAsync(c => c.Id == request.ChildId, cancellationToken);

        if (child is null)
            throw new KeyNotFoundException($"Child with ID '{request.ChildId}' was not found.");

        var staff = await StaffResolver.ResolveStaffAsync(
            _db,
            _currentUserService,
            request.ReportedByStaffId,
            cancellationToken);

        var staffId = staff.Id;

        var incident = new IncidentReport
        {
            Id = Guid.NewGuid(),
            ChildId = child.Id,
            ClassroomId = request.ClassroomId,
            ReportedByStaffId = staffId,
            IncidentTime = request.IncidentTime,
            IncidentType = string.IsNullOrWhiteSpace(request.IncidentType) ? "Minor Injury" : request.IncidentType.Trim(),
            Location = string.IsNullOrWhiteSpace(request.Location) ? "Classroom / Playground" : request.Location.Trim(),
            Description = request.Description.Trim(),
            FirstAidAdministered = request.FirstAidAdministered?.Trim() ?? string.Empty,
            WitnessStaffNames = request.WitnessStaffNames?.Trim(),
            Severity = request.Severity,
            ParentNotified = request.ParentNotified,
            ParentNotifiedAt = request.ParentNotified ? DateTime.UtcNow : null,
            ParentNotifiedMethod = string.IsNullOrWhiteSpace(request.ParentNotifiedMethod) ? "App" : request.ParentNotifiedMethod.Trim(),
            IsAcknowledgedByParent = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Incidents.Add(incident);
        await _db.SaveChangesAsync(cancellationToken);

        return (await GetByIdAsync(incident.Id, cancellationToken))!;
    }

    public async Task<IReadOnlyList<IncidentResponse>> GetAllAsync(
        Guid? childId = null,
        Guid? classroomId = null,
        DateTime? date = null,
        CancellationToken cancellationToken = default)
    {
        var query = _db.Incidents
            .Include(i => i.Child)
            .Include(i => i.ReportedByStaff)
            .Include(i => i.Classroom)
            .AsNoTracking();

        if (childId.HasValue && childId.Value != Guid.Empty)
            query = query.Where(i => i.ChildId == childId.Value);

        if (classroomId.HasValue && classroomId.Value != Guid.Empty)
            query = query.Where(i => i.ClassroomId == classroomId.Value);

        if (date.HasValue)
        {
            var d = date.Value.Date;
            query = query.Where(i => i.IncidentTime.Date == d);
        }

        var list = await query
            .OrderByDescending(i => i.IncidentTime)
            .ToListAsync(cancellationToken);

        return list.Select(MapToResponse).ToList();
    }

    public async Task<IncidentResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await _db.Incidents
            .Include(i => i.Child)
            .Include(i => i.ReportedByStaff)
            .Include(i => i.Classroom)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        return item is null ? null : MapToResponse(item);
    }

    public async Task<IncidentResponse> AcknowledgeAsync(
        Guid id,
        AcknowledgeIncidentRequest request,
        string? parentUserName = null,
        CancellationToken cancellationToken = default)
    {
        var incident = await _db.Incidents
            .Include(i => i.Child)
            .Include(i => i.ReportedByStaff)
            .Include(i => i.Classroom)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (incident is null)
            throw new KeyNotFoundException($"Incident with ID '{id}' was not found.");

        incident.IsAcknowledgedByParent = true;
        incident.ParentAcknowledgedAt = DateTime.UtcNow;
        incident.ParentSignatureName = !string.IsNullOrWhiteSpace(request.ParentSignatureName)
            ? request.ParentSignatureName.Trim()
            : (!string.IsNullOrWhiteSpace(parentUserName) ? parentUserName : "Parent / Guardian");
        incident.ParentComments = request.Comment?.Trim();
        incident.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return MapToResponse(incident);
    }

    private static IncidentResponse MapToResponse(IncidentReport i)
    {
        return new IncidentResponse
        {
            Id = i.Id,
            ChildId = i.ChildId,
            ChildName = i.Child != null ? $"{i.Child.FirstName} {i.Child.LastName}" : string.Empty,
            ChildPhotoUrl = i.Child?.PhotoUrl,
            ClassroomId = i.ClassroomId,
            ClassroomName = i.Classroom?.Name,
            ReportedByStaffId = i.ReportedByStaffId,
            ReportedByStaffName = i.ReportedByStaff != null ? $"{i.ReportedByStaff.FirstName} {i.ReportedByStaff.LastName}" : string.Empty,
            IncidentTime = i.IncidentTime,
            IncidentType = i.IncidentType,
            Location = i.Location,
            Description = i.Description,
            FirstAidAdministered = i.FirstAidAdministered,
            WitnessStaffNames = i.WitnessStaffNames,
            Severity = i.Severity,
            ParentNotified = i.ParentNotified,
            ParentNotifiedAt = i.ParentNotifiedAt,
            ParentNotifiedMethod = i.ParentNotifiedMethod,
            IsAcknowledgedByParent = i.IsAcknowledgedByParent,
            ParentAcknowledgedAt = i.ParentAcknowledgedAt,
            ParentSignatureName = i.ParentSignatureName,
            ParentComments = i.ParentComments,
            CreatedAt = i.CreatedAt,
            UpdatedAt = i.UpdatedAt
        };
    }
}
