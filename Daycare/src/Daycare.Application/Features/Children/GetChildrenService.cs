using Daycare.Application.DTOs.Children;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Children;

public interface IGetChildrenService
{
    Task<IReadOnlyList<ChildResponse>> ExecuteAsync(CancellationToken cancellationToken = default);
}

public class GetChildrenService : IGetChildrenService
{
    private readonly IDaycareDbContext _db;

    public GetChildrenService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<IReadOnlyList<ChildResponse>> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Children
            .AsNoTracking()
            .Include(c => c.Guardian)
            .OrderBy(c => c.LastName)
            .ThenBy(c => c.FirstName)
            .Select(child => new ChildResponse
            {
                Id = child.Id,
                FirstName = child.FirstName,
                LastName = child.LastName,
                DateOfBirth = child.DateOfBirth,
                Gender = child.Gender,
                GuardianId = child.GuardianId,
                GuardianName = child.Guardian != null
                    ? (child.Guardian.FirstName + " " + child.Guardian.LastName).Trim()
                    : string.Empty,
                PhotoUrl = child.PhotoUrl,
                Allergies = child.Allergies,
                DietaryRestrictions = child.DietaryRestrictions,
                MedicalNotes = child.MedicalNotes,
                Medications = child.Medications,
                BloodType = child.BloodType,
                EmergencyContactName = child.EmergencyContactName,
                EmergencyContactPhone = child.EmergencyContactPhone,
                PediatricianName = child.PediatricianName,
                PediatricianPhone = child.PediatricianPhone,
                SpecialNeedsNotes = child.SpecialNeedsNotes,
                CreatedAt = child.CreatedAt,
                UpdatedAt = child.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }
}
