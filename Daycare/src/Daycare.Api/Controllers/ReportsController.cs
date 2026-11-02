using Daycare.Application.DTOs.Reports;
using Daycare.Application.Features.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Daycare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IGetDailyReportService _getDailyReportService;

    public ReportsController(IGetDailyReportService getDailyReportService)
    {
        _getDailyReportService = getDailyReportService ?? throw new ArgumentNullException(nameof(getDailyReportService));
    }

    [HttpGet("daily")]
    [ProducesResponseType(typeof(DailyReportResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDailyReport(
        [FromQuery] DateOnly? date,
        [FromQuery] Guid? classroomId,
        CancellationToken cancellationToken)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var report = await _getDailyReportService.ExecuteAsync(targetDate, classroomId, cancellationToken);
        return Ok(report);
    }
}
