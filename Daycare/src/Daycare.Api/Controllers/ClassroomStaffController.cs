using Daycare.Application.DTOs.ClassroomStaff;
using Daycare.Application.Features.ClassroomStaff;
using Daycare.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Daycare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClassroomStaffController : ControllerBase
{
    private readonly IAssignStaffToClassroomService _assignService;
    private readonly IRemoveStaffFromClassroomService _removeService;
    private readonly IGetClassroomStaffService _getClassroomStaffService;
    private readonly IGetStaffClassroomsService _getStaffClassroomsService;

    public ClassroomStaffController(
        IAssignStaffToClassroomService assignService,
        IRemoveStaffFromClassroomService removeService,
        IGetClassroomStaffService getClassroomStaffService,
        IGetStaffClassroomsService getStaffClassroomsService)
    {
        _assignService = assignService;
        _removeService = removeService;
        _getClassroomStaffService = getClassroomStaffService;
        _getStaffClassroomsService = getStaffClassroomsService;
    }

    [HttpGet("classroom/{classroomId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<ClassroomStaffResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByClassroom(Guid classroomId, [FromQuery] bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        var list = await _getClassroomStaffService.ExecuteAsync(classroomId, activeOnly, cancellationToken);
        return Ok(list);
    }

    [HttpGet("staff/{staffId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<ClassroomStaffResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByStaff(Guid staffId, [FromQuery] bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        var list = await _getStaffClassroomsService.ExecuteAsync(staffId, activeOnly, cancellationToken);
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ClassroomStaffResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Assign([FromBody] AssignStaffToClassroomRequest request, CancellationToken cancellationToken)
    {
        var assignment = await _assignService.ExecuteAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, assignment);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ClassroomStaffResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Remove(Guid id, CancellationToken cancellationToken)
    {
        var result = await _removeService.ExecuteAsync(id, cancellationToken);
        return Ok(result);
    }
}
