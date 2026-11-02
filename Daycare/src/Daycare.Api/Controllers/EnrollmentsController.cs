using Daycare.Application.DTOs.Enrollment;
using Daycare.Application.Features.Enrollment;
using Daycare.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Daycare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EnrollmentsController : ControllerBase
{
    private readonly IEnrollChildService _enrollService;
    private readonly IGetEnrollmentService _getService;
    private readonly IGetEnrollmentsService _getAllService;
    private readonly IGetClassroomEnrollmentsService _getClassroomEnrollmentsService;
    private readonly IGetChildEnrollmentsService _getChildEnrollmentsService;
    private readonly IEndEnrollmentService _endService;
    private readonly ITransferChildClassroomService _transferService;

    public EnrollmentsController(
        IEnrollChildService enrollService,
        IGetEnrollmentService getService,
        IGetEnrollmentsService getAllService,
        IGetClassroomEnrollmentsService getClassroomEnrollmentsService,
        IGetChildEnrollmentsService getChildEnrollmentsService,
        IEndEnrollmentService endService,
        ITransferChildClassroomService transferService)
    {
        _enrollService = enrollService;
        _getService = getService;
        _getAllService = getAllService;
        _getClassroomEnrollmentsService = getClassroomEnrollmentsService;
        _getChildEnrollmentsService = getChildEnrollmentsService;
        _endService = endService;
        _transferService = transferService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<EnrollmentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? classroomId,
        [FromQuery] Guid? childId,
        [FromQuery] EnrollmentStatus? status,
        CancellationToken cancellationToken)
    {
        var enrollments = await _getAllService.ExecuteAsync(classroomId, childId, status, cancellationToken);
        return Ok(enrollments);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(EnrollmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var enrollment = await _getService.ExecuteAsync(id, cancellationToken);
        if (enrollment is null)
            return NotFound(new { message = $"Enrollment with ID '{id}' was not found." });

        return Ok(enrollment);
    }

    [HttpGet("classroom/{classroomId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<EnrollmentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByClassroom(Guid classroomId, [FromQuery] bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        var list = await _getClassroomEnrollmentsService.ExecuteAsync(classroomId, activeOnly, cancellationToken);
        return Ok(list);
    }

    [HttpGet("child/{childId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<EnrollmentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByChild(Guid childId, CancellationToken cancellationToken)
    {
        var list = await _getChildEnrollmentsService.ExecuteAsync(childId, cancellationToken);
        return Ok(list);
    }

    [HttpPost]
    [ProducesResponseType(typeof(EnrollmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Enroll([FromBody] EnrollChildRequest request, CancellationToken cancellationToken)
    {
        var enrollment = await _enrollService.ExecuteAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = enrollment.Id }, enrollment);
    }

    [HttpPost("transfer")]
    [ProducesResponseType(typeof(EnrollmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Transfer([FromBody] TransferChildClassroomRequest request, CancellationToken cancellationToken)
    {
        var enrollment = await _transferService.ExecuteAsync(request, cancellationToken);
        return Ok(enrollment);
    }

    [HttpPost("{id:guid}/end")]
    [ProducesResponseType(typeof(EnrollmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> End(Guid id, CancellationToken cancellationToken)
    {
        var enrollment = await _endService.ExecuteAsync(id, cancellationToken);
        return Ok(enrollment);
    }
}
