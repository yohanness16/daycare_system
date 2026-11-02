namespace Daycare.Application.DTOs.Parent;

public class CreateAbsenceRequest
{
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public int Reason { get; set; } // 0=Sick, 1=Appointment, 2=FamilyTrip, 3=Other
    public string? Details { get; set; }
}

public class ParentAbsenceResponse
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public string ChildName { get; set; } = string.Empty;
    public string FromDate { get; set; } = string.Empty;
    public string ToDate { get; set; } = string.Empty;
    public int Reason { get; set; }
    public string? Details { get; set; }
    public string Status { get; set; } = "Submitted";
    public DateTime? AcknowledgedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePickupNoticeRequest
{
    public string PickupPersonName { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public string? EstimatedTime { get; set; }
    public string? Notes { get; set; }
}

public class ParentPickupNoticeResponse
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public string PickupPersonName { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string? EstimatedTime { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "Approved";
    public DateTime CreatedAt { get; set; }
}

public class CreateHomeNoteRequest
{
    public string Category { get; set; } = "General"; // Teething, Sleep, Medication, Mood, General
    public string Text { get; set; } = string.Empty;
    public DateOnly? Date { get; set; }
}

public class ParentHomeNoteResponse
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public string Date { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Guid? AcknowledgedByStaffId { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
}
