namespace Daycare.Domain.Entities;

public class AbsenceNotice
{
    public Guid Id { get; set; }

    public Guid ChildId { get; set; }

    public Child Child { get; set; } = null!;

    public Guid GuardianId { get; set; }

    public Guardian Guardian { get; set; } = null!;

    public DateOnly FromDate { get; set; }

    public DateOnly ToDate { get; set; }

    public int Reason { get; set; } // 0=Sick, 1=Appointment, 2=FamilyTrip, 3=Other

    public string? Details { get; set; }

    public string Status { get; set; } = "Submitted"; // Submitted, Acknowledged, Cancelled

    public DateTime? AcknowledgedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
