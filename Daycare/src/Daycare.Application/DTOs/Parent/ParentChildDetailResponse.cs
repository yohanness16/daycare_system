namespace Daycare.Application.DTOs.Parent;

public class ParentChildDetailResponse
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public int AgeMonths { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public ParentGuardianSummary Guardian { get; set; } = new();
    public ParentEnrollmentSummary? Enrollment { get; set; }
    public ParentHealthSummary Health { get; set; } = new();
}

public class ParentGuardianSummary
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class ParentEnrollmentSummary
{
    public int Status { get; set; }
    public Guid ClassroomId { get; set; }
    public string ClassroomName { get; set; } = string.Empty;
    public DateTime EnrollmentDate { get; set; }
    public DateTime? EndDate { get; set; }
    public IReadOnlyList<ParentEnrollmentTeacherSummary> Teachers { get; set; } = Array.Empty<ParentEnrollmentTeacherSummary>();
}

public class ParentEnrollmentTeacherSummary
{
    public Guid StaffId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public bool CanMessage { get; set; } = true;
}

public class ParentHealthSummary
{
    public IReadOnlyList<string> Allergies { get; set; } = Array.Empty<string>();
    public IReadOnlyList<string> DietaryRestrictions { get; set; } = Array.Empty<string>();
    public string? MedicalNotes { get; set; }
    public string? Medications { get; set; }
    public string? BloodType { get; set; }
    public ParentContactSummary? EmergencyContact { get; set; }
    public ParentContactSummary? Pediatrician { get; set; }
    public string? SpecialNeedsNotes { get; set; }
    public string VerificationStatus { get; set; } = "Verified";
}

public class ParentContactSummary
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
}
