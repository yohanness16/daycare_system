using Daycare.Application.DTOs.Parent;

namespace Daycare.Application.Features.Parent;

public interface IParentPortalService
{
    Task<ParentChildLiveStatusResponse> GetChildLiveStatusAsync(Guid childId, CancellationToken cancellationToken = default);

    Task<ParentDailyReportResponse> GetDailyReportAsync(Guid childId, DateOnly date, CancellationToken cancellationToken = default);

    Task<ParentWellbeingOverviewResponse> GetWellbeingOverviewAsync(Guid childId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default);

    Task<ParentAbsenceResponse> CreateAbsenceAsync(Guid childId, CreateAbsenceRequest request, CancellationToken cancellationToken = default);

    Task<ParentPickupNoticeResponse> CreatePickupNoticeAsync(Guid childId, CreatePickupNoticeRequest request, CancellationToken cancellationToken = default);

    Task<ParentHomeNoteResponse> CreateHomeNoteAsync(Guid childId, CreateHomeNoteRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ParentComplaintSummaryResponse>> GetComplaintsAsync(CancellationToken cancellationToken = default);

    Task<ParentComplaintDetailResponse> GetComplaintDetailAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ParentComplaintDetailResponse> CreateComplaintAsync(CreateComplaintRequest request, CancellationToken cancellationToken = default);

    Task<ParentComplaintDetailResponse> AddComplaintMessageAsync(Guid id, string body, CancellationToken cancellationToken = default);

    Task RateComplaintAsync(Guid id, int rating, string? comment, CancellationToken cancellationToken = default);

    Task ReopenComplaintAsync(Guid id, string reason, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ParentNotificationResponse>> GetNotificationsAsync(CancellationToken cancellationToken = default);

    Task MarkNotificationReadAsync(Guid id, CancellationToken cancellationToken = default);

    Task MarkAllNotificationsReadAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ParentAnnouncementResponse>> GetAnnouncementsAsync(CancellationToken cancellationToken = default);

    Task AcknowledgeAnnouncementAsync(Guid id, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ParentConsentResponse>> GetConsentsAsync(CancellationToken cancellationToken = default);

    Task RespondConsentAsync(Guid id, string decision, Guid? childId, CancellationToken cancellationToken = default);
}
