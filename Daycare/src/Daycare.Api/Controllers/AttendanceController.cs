using Daycare.Application.DTOs.Attendance;
using Daycare.Application.Features.Attendance;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Daycare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IRecordAttendanceService _recordService;
    private readonly ICheckOutAttendanceService _checkOutService;
    private readonly IGetDailyAttendanceService _getDailyService;
    private readonly IGetClassroomDailyAttendanceService _getClassroomDailyService;
    private readonly IGetChildAttendanceService _getChildAttendanceService;

    public AttendanceController(
        IRecordAttendanceService recordService,
        ICheckOutAttendanceService checkOutService,
        IGetDailyAttendanceService getDailyService,
        IGetClassroomDailyAttendanceService getClassroomDailyService,
        IGetChildAttendanceService getChildAttendanceService)
    {
        _recordService = recordService;
        _checkOutService = checkOutService;
        _getDailyService = getDailyService;
        _getClassroomDailyService = getClassroomDailyService;
        _getChildAttendanceService = getChildAttendanceService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(AttendanceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Record([FromBody] RecordAttendanceRequest request, CancellationToken cancellationToken)
    {
        var result = await _recordService.ExecuteAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("checkout")]
    [ProducesResponseType(typeof(AttendanceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CheckOut([FromBody] CheckOutAttendanceRequest request, CancellationToken cancellationToken)
    {
        var result = await _checkOutService.ExecuteAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpGet("daily")]
    [ProducesResponseType(typeof(IReadOnlyList<AttendanceResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDaily([FromQuery] DateOnly? date, CancellationToken cancellationToken)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var list = await _getDailyService.ExecuteAsync(targetDate, cancellationToken);
        return Ok(list);
    }

    [HttpGet("classroom/{classroomId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<AttendanceResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByClassroom(Guid classroomId, [FromQuery] DateOnly? date, CancellationToken cancellationToken)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var list = await _getClassroomDailyService.ExecuteAsync(classroomId, targetDate, cancellationToken);
        return Ok(list);
    }

    [HttpGet("child/{childId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<AttendanceResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByChild(Guid childId, CancellationToken cancellationToken)
    {
        var list = await _getChildAttendanceService.ExecuteAsync(childId, cancellationToken);
        return Ok(list);
    }
}
