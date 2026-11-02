namespace Daycare.Application.DTOs.Chat;

public class ConversationParticipantResponse
{
    public Guid UserId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string? PhotoUrl { get; set; }
}

public class LastMessageSummaryResponse
{
    public string Preview { get; set; } = string.Empty;

    public string SenderName { get; set; } = string.Empty;

    public DateTime At { get; set; }
}

public class ConversationResponse
{
    public Guid Id { get; set; }

    public int Type { get; set; } // 0=Direct, 1=Classroom, 2=Center

    public string Title { get; set; } = string.Empty;

    public Guid? ChildId { get; set; }

    public string? ChildName { get; set; }

    public int UnreadCount { get; set; }

    public bool IsMuted { get; set; }

    public LastMessageSummaryResponse? LastMessage { get; set; }

    public IReadOnlyList<ConversationParticipantResponse> Participants { get; set; } = Array.Empty<ConversationParticipantResponse>();
}
