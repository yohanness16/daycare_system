namespace Daycare.Application.DTOs.Parent;

public class ParentNotificationResponse
{
    public Guid Id { get; set; }
    public string Type { get; set; } = "NOTIFICATION";
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public Guid? ChildId { get; set; }
    public string? ChildName { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; }
    public string Priority { get; set; } = "Normal";
    public string? ActionUrl { get; set; }
}

public class ParentAnnouncementResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Audience { get; set; } = "All";
    public DateTime PublishedAt { get; set; }
    public bool RequiresAcknowledgement { get; set; }
    public bool IsAcknowledged { get; set; }
    public string AuthorName { get; set; } = "Daycare Center Administration";
}

public class ParentConsentResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0";
    public bool Required { get; set; }
    public string Decision { get; set; } = "NeedsResponse"; // NeedsResponse, Granted, Denied
    public DateTime? RespondedAt { get; set; }
    public Guid? ChildId { get; set; }
}

public class RespondConsentRequest
{
    public string Decision { get; set; } = "Granted"; // Granted, Denied
    public Guid? ChildId { get; set; }
}
