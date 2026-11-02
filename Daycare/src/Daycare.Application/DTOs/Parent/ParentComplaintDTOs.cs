namespace Daycare.Application.DTOs.Parent;

public class CreateComplaintRequest
{
    public int Category { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Priority { get; set; } = 1;
    public Guid? ChildId { get; set; }
}

public class AddComplaintMessageRequest
{
    public string Body { get; set; } = string.Empty;
}

public class RateComplaintRequest
{
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

public class ReopenComplaintRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class ParentComplaintSummaryResponse
{
    public Guid Id { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public int Category { get; set; }
    public int Status { get; set; }
    public int Priority { get; set; }
    public string? ChildName { get; set; }
    public Guid? ChildId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool HasUnread { get; set; }
    public DateTime? SlaDueAt { get; set; }
}

public class ParentComplaintDetailResponse : ParentComplaintSummaryResponse
{
    public string Description { get; set; } = string.Empty;
    public ParentComplaintAssignee? AssignedTo { get; set; }
    public IReadOnlyList<ParentComplaintMessageResponse> Messages { get; set; } = Array.Empty<ParentComplaintMessageResponse>();
    public IReadOnlyList<ParentComplaintStatusHistoryEntry> StatusHistory { get; set; } = Array.Empty<ParentComplaintStatusHistoryEntry>();
    public string? ResolutionSummary { get; set; }
    public int? SatisfactionRating { get; set; }
    public bool CanReopen { get; set; }
    public bool CanRate { get; set; }
}

public class ParentComplaintAssignee
{
    public string Name { get; set; } = "Director on Duty";
}

public class ParentComplaintMessageResponse
{
    public Guid Id { get; set; }
    public string AuthorRole { get; set; } = "Parent";
    public string AuthorName { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public IReadOnlyList<ParentComplaintAttachment> Attachments { get; set; } = Array.Empty<ParentComplaintAttachment>();
}

public class ParentComplaintAttachment
{
    public string FileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public long? SizeBytes { get; set; }
}

public class ParentComplaintStatusHistoryEntry
{
    public int From { get; set; }
    public int To { get; set; }
    public DateTime At { get; set; }
    public string? Reason { get; set; }
}
