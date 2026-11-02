using System.Security.Claims;
using Daycare.Api.Hubs;
using Daycare.Application.DTOs.Chat;
using Daycare.Application.Features.Chat;
using Daycare.Application.Interfaces;
using Daycare.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace Daycare.Api.Controllers;

[ApiController]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IHubContext<DaycareHub> _hubContext;
    private readonly ICurrentUserService _currentUserService;

    public ChatController(
        IChatService chatService,
        IHubContext<DaycareHub> hubContext,
        ICurrentUserService currentUserService)
    {
        _chatService = chatService ?? throw new ArgumentNullException(nameof(chatService));
        _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    private (Guid userId, string userName, string userRole, string? userPhoto) ResolveCurrentUser()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userId = Guid.TryParse(userIdStr, out var id) ? id : (_currentUserService.UserId ?? Guid.Empty);

        var given = User.FindFirstValue(ClaimTypes.GivenName) ?? User.FindFirstValue("given_name");
        var family = User.FindFirstValue(ClaimTypes.Surname) ?? User.FindFirstValue("family_name");
        var fullName = !string.IsNullOrWhiteSpace(given) ? $"{given} {family}".Trim() : null;
        var userName = fullName ?? User.FindFirstValue("firstName") ?? User.Identity?.Name ?? "User";
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "Staff";

        return (userId, userName, userRole, null);
    }

    [HttpGet("api/chat/conversations")]
    [HttpGet("api/parent/chat/conversations")]
    [ProducesResponseType(typeof(IReadOnlyList<ConversationResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConversations(CancellationToken cancellationToken)
    {
        var (userId, _, userRole, _) = ResolveCurrentUser();
        var staffId = _currentUserService.StaffId;
        var isAdmin = _currentUserService.IsAdmin || string.Equals(userRole, Roles.Admin, StringComparison.OrdinalIgnoreCase);
        var conversations = await _chatService.GetUserConversationsAsync(userId, staffId, isAdmin, cancellationToken);
        return Ok(conversations);
    }

    [HttpPost("api/chat/conversations")]
    [HttpPost("api/parent/chat/conversations")]
    [ProducesResponseType(typeof(ConversationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateConversation([FromBody] CreateConversationRequest request, CancellationToken cancellationToken)
    {
        var (userId, userName, userRole, userPhoto) = ResolveCurrentUser();
        request.ChildId ??= _currentUserService.ChildId;
        var conversation = await _chatService.CreateConversationAsync(userId, userName, userRole, userPhoto, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, conversation);
    }

    [HttpGet("api/chat/conversations/{id:guid}/messages")]
    [HttpGet("api/parent/chat/conversations/{id:guid}/messages")]
    [ProducesResponseType(typeof(IReadOnlyList<ChatMessageResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMessages(Guid id, [FromQuery] int limit = 50, CancellationToken cancellationToken = default)
    {
        var (userId, _, _, _) = ResolveCurrentUser();
        var messages = await _chatService.GetConversationMessagesAsync(id, userId, limit, cancellationToken);
        return Ok(messages);
    }

    [HttpPost("api/chat/conversations/{id:guid}/messages")]
    [HttpPost("api/parent/chat/conversations/{id:guid}/messages")]
    [ProducesResponseType(typeof(ChatMessageResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendMessage(Guid id, [FromBody] SendMessageRequest request, CancellationToken cancellationToken)
    {
        var (userId, userName, userRole, userPhoto) = ResolveCurrentUser();
        var message = await _chatService.SendMessageAsync(id, userId, userName, userRole, userPhoto, request, cancellationToken);

        // Real-time broadcast via SignalR WebSocket to the conversation room and users
        try
        {
            await _hubContext.Clients.Group($"conversation:{id}").SendAsync("ReceiveMessage", new
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                SenderId = message.Sender.UserId.ToString(),
                SenderName = message.Sender.Name,
                SenderRole = message.Sender.Role,
                Content = message.Body,
                SentAt = message.CreatedAt.ToString("o"),
                ClientId = message.ClientId,
                Status = "sent"
            }, cancellationToken);
        }
        catch (Exception ex)
        {
            // Logging SignalR broadcast issue without failing DB write
            Console.WriteLine($"[SignalR Warning] Failed to broadcast message to group conversation:{id}: {ex.Message}");
        }

        return StatusCode(StatusCodes.Status201Created, message);
    }

    [HttpPost("api/chat/conversations/{id:guid}/read")]
    [HttpPost("api/parent/chat/conversations/{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken cancellationToken)
    {
        var (userId, _, _, _) = ResolveCurrentUser();
        await _chatService.MarkConversationReadAsync(id, userId, cancellationToken);
        return NoContent();
    }
}
