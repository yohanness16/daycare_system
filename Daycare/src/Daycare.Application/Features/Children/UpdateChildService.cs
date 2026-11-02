using Daycare.Application.DTOs.Children;
using Daycare.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Children;

public interface IUpdateChildService
{
    Task<ChildResponse> ExecuteAsync(Guid id, UpdateChildRequest request, CancellationToken cancellationToken = default);
}

public class UpdateChildService : IUpdateChildService
{
    private readonly IDaycareDbContext _db;

    public UpdateChildService(IDaycareDbContext db)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public async Task<ChildResponse> ExecuteAsync(
        Guid id,
        UpdateChildRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.FirstName))
            throw new ArgumentException("First name is required.", nameof(request.FirstName));

        if (string.IsNullOrWhiteSpace(request.LastName))
            throw new ArgumentException("Last name is required.", nameof(request.LastName));

        if (request.GuardianId == Guid.Empty)
            throw new ArgumentException("A valid GuardianId is required.", nameof(request.GuardianId));

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (request.DateOfBirth > today)
            throw new ArgumentException("Date of birth cannot be in the future.", nameof(request.DateOfBirth));

        var guardian = await _db.Guardians
            .FirstOrDefaultAsync(g => g.Id == request.GuardianId, cancellationToken);

        if (guardian is null)
            throw new KeyNotFoundException($"Guardian with ID '{request.GuardianId}' was not found.");

        var child = await _db.Children
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (child is null)
            throw new KeyNotFoundException($"Child with ID '{id}' was not found.");

        child.FirstName = request.FirstName.Trim();
        child.LastName = request.LastName.Trim();
        child.DateOfBirth = request.DateOfBirth;
        child.Gender = request.Gender.Trim();
        child.GuardianId = request.GuardianId;
        if (request.PhotoUrl != null) child.PhotoUrl = request.PhotoUrl;
        if (request.Allergies != null) child.Allergies = request.Allergies;
        if (request.DietaryRestrictions != null) child.DietaryRestrictions = request.DietaryRestrictions;
        if (request.MedicalNotes != null) child.MedicalNotes = request.MedicalNotes;
        if (request.Medications != null) child.Medications = request.Medications;
        if (request.BloodType != null) child.BloodType = request.BloodType;
        if (request.EmergencyContactName != null) child.EmergencyContactName = request.EmergencyContactName;
        if (request.EmergencyContactPhone != null) child.EmergencyContactPhone = request.EmergencyContactPhone;
        if (request.PediatricianName != null) child.PediatricianName = request.PediatricianName;
        if (request.PediatricianPhone != null) child.PediatricianPhone = request.PediatricianPhone;
        if (request.SpecialNeedsNotes != null) child.SpecialNeedsNotes = request.SpecialNeedsNotes;
        child.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return new ChildResponse
        {
            Id = child.Id,
            FirstName = child.FirstName,
            LastName = child.LastName,
            DateOfBirth = child.DateOfBirth,
            Gender = child.Gender,
            GuardianId = guardian.Id,
            GuardianName = $"{guardian.FirstName} {guardian.LastName}".Trim(),
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
