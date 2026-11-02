using Daycare.Application.DTOs.Parent;
using Daycare.Application.Features.Parent;
using Daycare.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Daycare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = Roles.Parent)]
public class ParentController : ControllerBase
{
    private readonly IGetParentProfileService _getProfileService;
    private readonly IUpdateParentProfileService _updateProfileService;
    private readonly IGetParentChildrenService _getChildrenService;
    private readonly IGetParentChildDetailService _getChildDetailService;
    private readonly IGetParentChildAttendanceService _getChildAttendanceService;
    private readonly IParentPortalService _parentPortalService;

    public ParentController(
        IGetParentProfileService getProfileService,
        IUpdateParentProfileService updateProfileService,
        IGetParentChildrenService getChildrenService,
        IGetParentChildDetailService getChildDetailService,
        IGetParentChildAttendanceService getChildAttendanceService,
        IParentPortalService parentPortalService)
    {
        _getProfileService = getProfileService;
        _updateProfileService = updateProfileService;
        _getChildrenService = getChildrenService;
        _getChildDetailService = getChildDetailService;
        _getChildAttendanceService = getChildAttendanceService;
        _parentPortalService = parentPortalService;
    }

    [HttpGet("profile")]
    [ProducesResponseType(typeof(ParentProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
    {
        var profile = await _getProfileService.ExecuteAsync(cancellationToken);
        return Ok(profile);
    }

    [HttpPut("profile")]
    [ProducesResponseType(typeof(ParentProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateParentProfileRequest request, CancellationToken cancellationToken)
    {
        var profile = await _updateProfileService.ExecuteAsync(request, cancellationToken);
        return Ok(profile);
    }

    [HttpGet("children")]
    [ProducesResponseType(typeof(IReadOnlyList<ParentChildCardResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChildren(CancellationToken cancellationToken)
    {
        var children = await _getChildrenService.ExecuteAsync(cancellationToken);
        return Ok(children);
    }

    [HttpGet("children/{childId:guid}")]
    [ProducesResponseType(typeof(ParentChildDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetChildDetail(Guid childId, CancellationToken cancellationToken)
    {
        var child = await _getChildDetailService.ExecuteAsync(childId, cancellationToken);
        return Ok(child);
    }

    [HttpGet("children/{childId:guid}/attendance")]
    [ProducesResponseType(typeof(IReadOnlyList<ParentChildAttendanceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetChildAttendance(
        Guid childId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken cancellationToken)
    {
        var attendance = await _getChildAttendanceService.ExecuteAsync(childId, from, to, cancellationToken);
        return Ok(attendance);
    }

    [HttpGet("children/{childId:guid}/status")]
    [ProducesResponseType(typeof(ParentChildLiveStatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetChildStatus(Guid childId, CancellationToken cancellationToken)
    {
        var status = await _parentPortalService.GetChildLiveStatusAsync(childId, cancellationToken);
        return Ok(status);
    }

    [HttpGet("children/{childId:guid}/daily-report")]
    [ProducesResponseType(typeof(ParentDailyReportResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDailyReport(
        Guid childId,
        [FromQuery] DateOnly? date,
        CancellationToken cancellationToken)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var report = await _parentPortalService.GetDailyReportAsync(childId, targetDate, cancellationToken);
        return Ok(report);
    }

    [HttpGet("children/{childId:guid}/wellbeing")]
    [HttpGet("children/{childId:guid}/wellbeing/overview")]
    [ProducesResponseType(typeof(ParentWellbeingOverviewResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWellbeing(
        Guid childId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken cancellationToken)
    {
        var wellbeing = await _parentPortalService.GetWellbeingOverviewAsync(childId, from, to, cancellationToken);
        return Ok(wellbeing);
    }

    [HttpPost("children/{childId:guid}/absence")]
    [HttpPost("children/{childId:guid}/absence-notices")]
    [ProducesResponseType(typeof(ParentAbsenceResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReportAbsence(
        Guid childId,
        [FromBody] CreateAbsenceRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _parentPortalService.CreateAbsenceAsync(childId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPost("children/{childId:guid}/pickup-notice")]
    [ProducesResponseType(typeof(ParentPickupNoticeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegisterPickupNotice(
        Guid childId,
        [FromBody] CreatePickupNoticeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _parentPortalService.CreatePickupNoticeAsync(childId, request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("children/{childId:guid}/home-note")]
    [HttpPost("children/{childId:guid}/home-notes")]
    [ProducesResponseType(typeof(ParentHomeNoteResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SubmitHomeNote(
        Guid childId,
        [FromBody] CreateHomeNoteRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _parentPortalService.CreateHomeNoteAsync(childId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpGet("complaints")]
    [ProducesResponseType(typeof(IReadOnlyList<ParentComplaintSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetComplaints(CancellationToken cancellationToken)
    {
        var list = await _parentPortalService.GetComplaintsAsync(cancellationToken);
        return Ok(list);
    }

    [HttpGet("complaints/{id:guid}")]
    [ProducesResponseType(typeof(ParentComplaintDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetComplaintDetail(Guid id, CancellationToken cancellationToken)
    {
        var detail = await _parentPortalService.GetComplaintDetailAsync(id, cancellationToken);
        return Ok(detail);
    }

    [HttpPost("complaints")]
    [ProducesResponseType(typeof(ParentComplaintDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateComplaint([FromBody] CreateComplaintRequest request, CancellationToken cancellationToken)
    {
        var detail = await _parentPortalService.CreateComplaintAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, detail);
    }

    [HttpPost("complaints/{id:guid}/messages")]
    [ProducesResponseType(typeof(ParentComplaintDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddComplaintMessage(Guid id, [FromBody] AddComplaintMessageRequest request, CancellationToken cancellationToken)
    {
        var detail = await _parentPortalService.AddComplaintMessageAsync(id, request.Body, cancellationToken);
        return Ok(detail);
    }

    [HttpPost("complaints/{id:guid}/rate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RateComplaint(Guid id, [FromBody] RateComplaintRequest request, CancellationToken cancellationToken)
    {
        await _parentPortalService.RateComplaintAsync(id, request.Rating, request.Comment, cancellationToken);
        return NoContent();
    }

    [HttpPost("complaints/{id:guid}/reopen")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReopenComplaint(Guid id, [FromBody] ReopenComplaintRequest request, CancellationToken cancellationToken)
    {
        await _parentPortalService.ReopenComplaintAsync(id, request.Reason, cancellationToken);
        return NoContent();
    }

    [HttpGet("notifications")]
    [ProducesResponseType(typeof(IReadOnlyList<ParentNotificationResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications(CancellationToken cancellationToken)
    {
        var list = await _parentPortalService.GetNotificationsAsync(cancellationToken);
        return Ok(list);
    }

    [HttpPost("notifications/{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkNotificationRead(Guid id, CancellationToken cancellationToken)
    {
        await _parentPortalService.MarkNotificationReadAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("notifications/read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllNotificationsRead(CancellationToken cancellationToken)
    {
        await _parentPortalService.MarkAllNotificationsReadAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("announcements")]
    [ProducesResponseType(typeof(IReadOnlyList<ParentAnnouncementResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAnnouncements(CancellationToken cancellationToken)
    {
        var list = await _parentPortalService.GetAnnouncementsAsync(cancellationToken);
        return Ok(list);
    }

    [HttpPost("announcements/{id:guid}/acknowledge")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> AcknowledgeAnnouncement(Guid id, CancellationToken cancellationToken)
    {
        await _parentPortalService.AcknowledgeAnnouncementAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("consents")]
    [ProducesResponseType(typeof(IReadOnlyList<ParentConsentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConsents(CancellationToken cancellationToken)
    {
        var list = await _parentPortalService.GetConsentsAsync(cancellationToken);
        return Ok(list);
    }

    [HttpPost("consents/{id:guid}/respond")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RespondConsent(Guid id, [FromBody] RespondConsentRequest request, CancellationToken cancellationToken)
    {
        await _parentPortalService.RespondConsentAsync(id, request.Decision, request.ChildId, cancellationToken);
        return NoContent();
    }
}
