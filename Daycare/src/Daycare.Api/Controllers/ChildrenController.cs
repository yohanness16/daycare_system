using Daycare.Application.DTOs.Children;
using Daycare.Application.Features.Children;
using Daycare.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Daycare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChildrenController : ControllerBase
{
    private readonly IRegisterChildService _registerService;
    private readonly IGetChildService _getService;
    private readonly IGetChildrenService _getAllService;
    private readonly IUpdateChildService _updateService;
    private readonly IDeleteChildService _deleteService;
    private readonly IGetChildDailyHistoryService _getDailyHistoryService;

    public ChildrenController(
        IRegisterChildService registerService,
        IGetChildService getService,
        IGetChildrenService getAllService,
        IUpdateChildService updateService,
        IDeleteChildService deleteService,
        IGetChildDailyHistoryService getDailyHistoryService)
    {
        _registerService = registerService;
        _getService = getService;
        _getAllService = getAllService;
        _updateService = updateService;
        _deleteService = deleteService;
        _getDailyHistoryService = getDailyHistoryService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ChildResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var children = await _getAllService.ExecuteAsync(cancellationToken);
        return Ok(children);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ChildResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var child = await _getService.ExecuteAsync(id, cancellationToken);
        if (child is null)
            return NotFound(new { message = $"Child with ID '{id}' was not found." });

        return Ok(child);
    }

    [HttpGet("{id:guid}/daily-history")]
    [ProducesResponseType(typeof(ChildDailyHistoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDailyHistory(Guid id, [FromQuery] DateOnly? date, CancellationToken cancellationToken)
    {
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var history = await _getDailyHistoryService.ExecuteAsync(id, targetDate, cancellationToken);
        return Ok(history);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ChildResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterChildRequest request, CancellationToken cancellationToken)
    {
        var child = await _registerService.ExecuteAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = child.Id }, child);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ChildResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateChildRequest request, CancellationToken cancellationToken)
    {
        var child = await _updateService.ExecuteAsync(id, request, cancellationToken);
        return Ok(child);
    }

    [HttpPatch("{id:guid}/photo")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePhoto(
        Guid id,
        [FromBody] Daycare.Application.DTOs.Common.UpdatePhotoRequest request,
        [FromServices] Daycare.Application.Interfaces.IDaycareDbContext db,
        CancellationToken cancellationToken)
    {
        var child = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
            db.Children, c => c.Id == id, cancellationToken);
        if (child is null)
            return NotFound(new { message = $"Child with ID '{id}' was not found." });

        child.PhotoUrl = request.PhotoUrl;
        child.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Ok(new { child.Id, child.PhotoUrl });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _deleteService.ExecuteAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:guid}/dependents")]
    [ProducesResponseType(typeof(Daycare.Application.DTOs.Dependents.ChildDependentsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDependents(
        Guid id,
        [FromServices] Daycare.Application.Features.Dependents.IGetChildDependentsService service,
        CancellationToken cancellationToken)
    {
        var dependents = await service.ExecuteAsync(id, cancellationToken);
        return Ok(dependents);
    }
}

