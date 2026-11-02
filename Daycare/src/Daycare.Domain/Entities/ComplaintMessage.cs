namespace Daycare.Domain.Entities;

public class ComplaintMessage
{
    public Guid Id { get; set; }

    public Guid ComplaintId { get; set; }

    public ParentComplaint Complaint { get; set; } = null!;

    public string AuthorRole { get; set; } = "Parent"; // Parent, Staff, Admin, System

    public string AuthorName { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
