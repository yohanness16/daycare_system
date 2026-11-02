using Daycare.Application.DTOs.Children;
using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Features.Children;

public interface IRegisterChildService
{
    Task<ChildResponse> ExecuteAsync(RegisterChildRequest request, CancellationToken cancellationToken = default);
}

public class RegisterChildService : IRegisterChildService
{
    private readonly IDaycareDbContext _context;

    public RegisterChildService(IDaycareDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<ChildResponse> ExecuteAsync(RegisterChildRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.FirstName))
        {
            throw new ArgumentException("First name is required.", nameof(request.FirstName));
        }

        if (string.IsNullOrWhiteSpace(request.LastName))
        {
            throw new ArgumentException("Last name is required.", nameof(request.LastName));
        }

        if (request.GuardianId == Guid.Empty)
        {
            throw new ArgumentException("A valid GuardianId is required.", nameof(request.GuardianId));
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (request.DateOfBirth > today)
        {
            throw new ArgumentException("Date of birth cannot be in the future.", nameof(request.DateOfBirth));
        }

        var guardian = await _context.Guardians
            .FirstOrDefaultAsync(g => g.Id == request.GuardianId, cancellationToken);

        if (guardian is null)
        {
            throw new KeyNotFoundException($"Guardian with ID '{request.GuardianId}' was not found.");
        }

        var child = new Child
        {
            Id = Guid.NewGuid(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender.Trim(),
            GuardianId = request.GuardianId,
            PhotoUrl = request.PhotoUrl,
            Allergies = request.Allergies ?? new List<string>(),
            DietaryRestrictions = request.DietaryRestrictions ?? new List<string>(),
            MedicalNotes = request.MedicalNotes,
            Medications = request.Medications,
            BloodType = request.BloodType,
            EmergencyContactName = request.EmergencyContactName,
            EmergencyContactPhone = request.EmergencyContactPhone,
            PediatricianName = request.PediatricianName,
            PediatricianPhone = request.PediatricianPhone,
            SpecialNeedsNotes = request.SpecialNeedsNotes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Children.Add(child);
        await _context.SaveChangesAsync(cancellationToken);

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
