using Daycare.Application.DTOs.Meals;
using Daycare.Application.Features.Meals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Daycare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MealsController : ControllerBase
{
    private readonly IRecordMealService _recordService;
    private readonly IUpdateMealService _updateService;
    private readonly IDeleteMealService _deleteService;
    private readonly IGetDailyMealsService _getDailyService;
    private readonly IGetChildMealsService _getChildService;

    public MealsController(
        IRecordMealService recordService,
        IUpdateMealService updateService,
        IDeleteMealService deleteService,
        IGetDailyMealsService getDailyService,
        IGetChildMealsService getChildService)
    {
        _recordService = recordService;
        _updateService = updateService;
        _deleteService = deleteService;
        _getDailyService = getDailyService;
        _getChildService = getChildService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(MealResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Record([FromBody] RecordMealRequest request, CancellationToken cancellationToken)
    {
        var meal = await _recordService.ExecuteAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, meal);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(MealResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMealRequest request, CancellationToken cancellationToken)
    {
        var meal = await _updateService.ExecuteAsync(id, request, cancellationToken);
        return Ok(meal);
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
    [ProducesResponseType(typeof(IReadOnlyList<MealResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDaily([FromQuery] DateOnly? date, CancellationToken cancellationToken)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var list = await _getDailyService.ExecuteAsync(targetDate, cancellationToken);
        return Ok(list);
    }

    [HttpGet("child/{childId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<MealResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByChild(Guid childId, CancellationToken cancellationToken)
    {
        var list = await _getChildService.ExecuteAsync(childId, cancellationToken);
        return Ok(list);
    }
}
