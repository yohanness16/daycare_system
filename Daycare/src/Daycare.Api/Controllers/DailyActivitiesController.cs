using Daycare.Application.DTOs.DailyActivities;
using Daycare.Application.Features.DailyActivities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Daycare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DailyActivitiesController : ControllerBase
{
    private readonly IRecordActivityService _recordService;
    private readonly IUpdateActivityService _updateService;
    private readonly IDeleteActivityService _deleteService;
    private readonly IGetDailyActivitiesService _getDailyService;
    private readonly IGetChildActivitiesService _getChildService;

    public DailyActivitiesController(
        IRecordActivityService recordService,
        IUpdateActivityService updateService,
        IDeleteActivityService deleteService,
        IGetDailyActivitiesService getDailyService,
        IGetChildActivitiesService getChildService)
    {
        _recordService = recordService;
        _updateService = updateService;
        _deleteService = deleteService;
        _getDailyService = getDailyService;
        _getChildService = getChildService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(DailyActivityResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Record([FromBody] RecordActivityRequest request, CancellationToken cancellationToken)
    {
        var activity = await _recordService.ExecuteAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, activity);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(DailyActivityResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateActivityRequest request, CancellationToken cancellationToken)
    {
        var activity = await _updateService.ExecuteAsync(id, request, cancellationToken);
        return Ok(activity);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _deleteService.ExecuteAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("daily")]
    [ProducesResponseType(typeof(IReadOnlyList<DailyActivityResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDaily([FromQuery] DateOnly? date, CancellationToken cancellationToken)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var list = await _getDailyService.ExecuteAsync(targetDate, cancellationToken);
        return Ok(list);
    }

    [HttpGet("child/{childId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<DailyActivityResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByChild(Guid childId, CancellationToken cancellationToken)
    {
        var list = await _getChildService.ExecuteAsync(childId, cancellationToken);
        return Ok(list);
    }
}
