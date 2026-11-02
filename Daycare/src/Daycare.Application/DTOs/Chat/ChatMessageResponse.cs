namespace Daycare.Application.DTOs.Chat;

public class ChatSenderResponse
{
    public Guid UserId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string? PhotoUrl { get; set; }
}

public class ChatReplyToResponse
{
    public Guid Id { get; set; }

    public string Preview { get; set; } = string.Empty;
}

public class ChatMessageResponse
{
    public Guid Id { get; set; }

    public Guid ConversationId { get; set; }

    public string? ClientId { get; set; }

    public ChatSenderResponse Sender { get; set; } = new();

    public int Type { get; set; } = 0;

    public string Body { get; set; } = string.Empty;

    public ChatReplyToResponse? ReplyTo { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? EditedAt { get; set; }

    public bool IsDeleted { get; set; }

    public string Status { get; set; } = "sent";
}
