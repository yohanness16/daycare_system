using Daycare.Application.DTOs.Chat;

namespace Daycare.Application.Features.Chat;

public interface IChatService
{
    Task<IReadOnlyList<ConversationResponse>> GetUserConversationsAsync(Guid userId, Guid? staffId = null, bool isAdmin = false, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ChatMessageResponse>> GetConversationMessagesAsync(Guid conversationId, Guid userId, int limit = 50, CancellationToken cancellationToken = default);

    Task<ChatMessageResponse> SendMessageAsync(Guid conversationId, Guid userId, string userName, string userRole, string? userPhoto, SendMessageRequest request, CancellationToken cancellationToken = default);

    Task<ConversationResponse> CreateConversationAsync(Guid userId, string userName, string userRole, string? userPhoto, CreateConversationRequest request, CancellationToken cancellationToken = default);

    Task MarkConversationReadAsync(Guid conversationId, Guid userId, CancellationToken cancellationToken = default);
}
