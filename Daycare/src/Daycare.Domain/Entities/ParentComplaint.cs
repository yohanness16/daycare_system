namespace Daycare.Domain.Entities;

public class ParentComplaint
{
    public Guid Id { get; set; }

    public string ReferenceNumber { get; set; } = string.Empty;

    public Guid GuardianId { get; set; }

    public Guardian Guardian { get; set; } = null!;

    public Guid? ChildId { get; set; }

    public Child? Child { get; set; }

    public int Category { get; set; } // 0=Safety, 1=StaffConduct, 2=Meals, 3=Cleanliness, 4=Communication, 5=Billing, 6=Curriculum, 7=Facilities, 8=Other

    public string Subject { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int Priority { get; set; } = 1; // 0=Low, 1=Normal, 2=High, 3=Urgent

    public int Status { get; set; } = 0; // 0=Submitted, 1=UnderReview, 2=InProgress, 3=WaitingOnParent, 4=Resolved, 5=Closed, 6=Reopened, 7=Rejected

    public int? SatisfactionRating { get; set; }

    public string? ResolutionSummary { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ComplaintMessage> Messages { get; set; } = new List<ComplaintMessage>();
}
