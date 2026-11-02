using Daycare.Application.DTOs.Classrooms;
using Daycare.Application.Features.Classrooms;
using Daycare.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Daycare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClassroomsController : ControllerBase
{
    private readonly ICreateClassroomService _createService;
    private readonly IGetClassroomService _getService;
    private readonly IGetClassroomsService _getAllService;
    private readonly IUpdateClassroomService _updateService;
    private readonly IDeleteClassroomService _deleteService;

    public ClassroomsController(
        ICreateClassroomService createService,
        IGetClassroomService getService,
        IGetClassroomsService getAllService,
        IUpdateClassroomService updateService,
        IDeleteClassroomService deleteService)
    {
        _createService = createService;
        _getService = getService;
        _getAllService = getAllService;
        _updateService = updateService;
        _deleteService = deleteService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ClassroomResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var classrooms = await _getAllService.ExecuteAsync(cancellationToken);
        return Ok(classrooms);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ClassroomResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var classroom = await _getService.ExecuteAsync(id, cancellationToken);
        if (classroom is null)
            return NotFound(new { message = $"Classroom with ID '{id}' was not found." });

        return Ok(classroom);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ClassroomResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateClassroomRequest request, CancellationToken cancellationToken)
    {
        var classroom = await _createService.ExecuteAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = classroom.Id }, classroom);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ClassroomResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClassroomRequest request, CancellationToken cancellationToken)
    {
        var classroom = await _updateService.ExecuteAsync(id, request, cancellationToken);
        return Ok(classroom);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _deleteService.ExecuteAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:guid}/dependents")]
    [ProducesResponseType(typeof(Daycare.Application.DTOs.Dependents.ClassroomDependentsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDependents(
        Guid id,
        [FromServices] Daycare.Application.Features.Dependents.IGetClassroomDependentsService service,
        CancellationToken cancellationToken)
    {
        var dependents = await service.ExecuteAsync(id, cancellationToken);
        return Ok(dependents);
    }
}

