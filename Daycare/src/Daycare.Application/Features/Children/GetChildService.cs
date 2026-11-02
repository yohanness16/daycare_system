using Daycare.Application.DTOs.Children;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Children;

public interface IGetChildService
{
    Task<ChildResponse?> ExecuteAsync(Guid id, CancellationToken cancellationToken = default);
}

public class GetChildService : IGetChildService
{
    private readonly IDaycareDbContext _db;

    public GetChildService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<ChildResponse?> ExecuteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var child = await _db.Children
            .AsNoTracking()
            .Include(c => c.Guardian)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (child is null)
            return null;

        return new ChildResponse
        {
            Id = child.Id,
            FirstName = child.FirstName,
            LastName = child.LastName,
            DateOfBirth = child.DateOfBirth,
            Gender = child.Gender,
            GuardianId = child.GuardianId,
            GuardianName = child.Guardian is not null
                ? $"{child.Guardian.FirstName} {child.Guardian.LastName}".Trim()
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
        };
    }
}
