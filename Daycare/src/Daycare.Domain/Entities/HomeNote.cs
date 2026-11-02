namespace Daycare.Domain.Entities;

public class HomeNote
{
    public Guid Id { get; set; }

    public Guid ChildId { get; set; }

    public Child Child { get; set; } = null!;

    public Guid GuardianId { get; set; }

    public Guardian Guardian { get; set; } = null!;

    public DateOnly Date { get; set; }

    public string Category { get; set; } = "General"; // Teething, Sleep, Medication, Mood, General

    public string Text { get; set; } = string.Empty;

    public Guid? AcknowledgedByStaffId { get; set; }

    public DateTime? AcknowledgedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
