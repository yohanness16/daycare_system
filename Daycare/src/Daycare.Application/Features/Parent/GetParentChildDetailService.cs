using Daycare.Application.DTOs.Parent;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Parent;

public interface IGetParentChildDetailService
{
    Task<ParentChildDetailResponse> ExecuteAsync(Guid childId, CancellationToken cancellationToken = default);
}

public class GetParentChildDetailService : IGetParentChildDetailService
{
    private readonly IParentAccessService _parentAccessService;
    private readonly IDaycareDbContext _db;

    public GetParentChildDetailService(IParentAccessService parentAccessService, IDaycareDbContext db)
    {
        _parentAccessService = parentAccessService;
        _db = db;
    }

    public async Task<ParentChildDetailResponse> ExecuteAsync(Guid childId, CancellationToken cancellationToken = default)
    {
        var owns = await _parentAccessService.OwnsChildAsync(childId, cancellationToken);
        if (!owns)
        {
            throw new KeyNotFoundException($"Child with ID '{childId}' was not found.");
        }

        var child = await _db.Children
            .Include(c => c.Guardian)
            .FirstOrDefaultAsync(c => c.Id == childId, cancellationToken);

        if (child == null)
        {
            throw new KeyNotFoundException($"Child with ID '{childId}' was not found.");
        }

        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);

        var enrollment = await _db.Enrollments
            .Include(e => e.Classroom)
            .Where(e => e.ChildId == childId &&
                        e.Status == EnrollmentStatus.Active &&
                        (e.EndDate == null || e.EndDate > now))
            .OrderByDescending(e => e.EnrollmentDate)
            .FirstOrDefaultAsync(cancellationToken);

        ParentEnrollmentSummary? enrollmentSummary = null;

        if (enrollment != null)
        {
            var teachers = await _db.ClassroomStaff
                .Include(cs => cs.Staff)
                .Where(cs => cs.ClassroomId == enrollment.ClassroomId &&
                             (cs.EndedAt == null || cs.EndedAt > now))
                .Select(cs => new ParentEnrollmentTeacherSummary
                {
                    StaffId = cs.StaffId,
                    Name = $"{cs.Staff.FirstName} {cs.Staff.LastName}".Trim(),
                    Role = cs.Staff.StaffRole.ToString(),
                    PhotoUrl = cs.Staff.PhotoUrl,
                    CanMessage = true
                })
                .ToListAsync(cancellationToken);

            enrollmentSummary = new ParentEnrollmentSummary
            {
                Status = (int)enrollment.Status,
                ClassroomId = enrollment.ClassroomId,
                ClassroomName = enrollment.Classroom.Name,
                EnrollmentDate = enrollment.EnrollmentDate,
                EndDate = enrollment.EndDate,
                Teachers = teachers
            };
        }

        var months = (today.Year - child.DateOfBirth.Year) * 12 + today.Month - child.DateOfBirth.Month;
        if (today.Day < child.DateOfBirth.Day) months--;
        var ageMonths = Math.Max(0, months);

        return new ParentChildDetailResponse
        {
            Id = child.Id,
            FirstName = child.FirstName,
            LastName = child.LastName,
            DateOfBirth = child.DateOfBirth,
            AgeMonths = ageMonths,
            Gender = child.Gender,
            PhotoUrl = child.PhotoUrl,
            Guardian = new ParentGuardianSummary
            {
                Id = child.Guardian.Id,
                Name = $"{child.Guardian.FirstName} {child.Guardian.LastName}".Trim(),
                Phone = child.Guardian.Phone,
                Email = child.Guardian.Email
            },
            Enrollment = enrollmentSummary,
            Health = new ParentHealthSummary
            {
                Allergies = child.Allergies,
                DietaryRestrictions = child.DietaryRestrictions,
                MedicalNotes = child.MedicalNotes,
                Medications = child.Medications,
                BloodType = child.BloodType,
                EmergencyContact = new ParentContactSummary
                {
                    Name = child.EmergencyContactName,
                    Phone = child.EmergencyContactPhone
                },
                Pediatrician = new ParentContactSummary
                {
                    Name = child.PediatricianName,
                    Phone = child.PediatricianPhone
                },
                SpecialNeedsNotes = child.SpecialNeedsNotes,
                VerificationStatus = "Verified"
            }
        };
    }
}
