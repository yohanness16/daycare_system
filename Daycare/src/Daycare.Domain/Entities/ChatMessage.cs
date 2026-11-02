namespace Daycare.Domain.Entities;

public class ChatMessage
{
    public Guid Id { get; set; }

    public Guid ConversationId { get; set; }

    public Conversation Conversation { get; set; } = null!;

    public Guid SenderUserId { get; set; }

    public string SenderName { get; set; } = string.Empty;

    public string SenderRole { get; set; } = string.Empty; // "Parent", "Teacher", "Admin", "System"

    public string? SenderPhotoUrl { get; set; }

    public string Body { get; set; } = string.Empty;

    public string? ClientId { get; set; }

    public Guid? ReplyToMessageId { get; set; }

    public ChatMessage? ReplyToMessage { get; set; }

    public string? ReplyToPreview { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? EditedAt { get; set; }

    public bool IsDeleted { get; set; } = false;

    public string Status { get; set; } = "sent"; // "sent", "delivered", "read"
}
