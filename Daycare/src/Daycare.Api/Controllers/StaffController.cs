using Daycare.Application.DTOs.Staff;
using Daycare.Application.Features.Staff;
using Daycare.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Daycare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StaffController : ControllerBase
{
    private readonly ICreateStaffService _createService;
    private readonly IGetStaffService _getService;
    private readonly IGetStaffListService _getAllService;
    private readonly IUpdateStaffService _updateService;
    private readonly IDeleteStaffService _deleteService;

    public StaffController(
        ICreateStaffService createService,
        IGetStaffService getService,
        IGetStaffListService getAllService,
        IUpdateStaffService updateService,
        IDeleteStaffService deleteService)
    {
        _createService = createService;
        _getService = getService;
        _getAllService = getAllService;
        _updateService = updateService;
        _deleteService = deleteService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<StaffResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] string? isActive, CancellationToken cancellationToken)
    {
        var staffList = await _getAllService.ExecuteAsync(isActive ?? "true", cancellationToken);
        return Ok(staffList);
    }


    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(StaffResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var staff = await _getService.ExecuteAsync(id, cancellationToken);
        if (staff is null)
            return NotFound(new { message = $"Staff member with ID '{id}' was not found." });

        return Ok(staff);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(StaffResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Create([FromBody] CreateStaffRequest request, CancellationToken cancellationToken)
    {
        var staff = await _createService.ExecuteAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = staff.Id }, staff);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(StaffResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStaffRequest request, CancellationToken cancellationToken)
    {
        var staff = await _updateService.ExecuteAsync(id, request, cancellationToken);
        return Ok(staff);
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
        var staff = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
            db.Staff, s => s.Id == id, cancellationToken);
        if (staff is null)
            return NotFound(new { message = $"Staff member with ID '{id}' was not found." });

        staff.PhotoUrl = request.PhotoUrl;
        staff.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Ok(new { staff.Id, staff.PhotoUrl });
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

    [HttpPost("{id:guid}/reset-password")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(Daycare.Application.DTOs.Auth.AdminResetPasswordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetStaffPassword(
        Guid id,
        [FromBody] Daycare.Application.DTOs.Auth.AdminResetPasswordRequest? request,
        [FromServices] Daycare.Application.Interfaces.IAuthService authService,
        [FromServices] Daycare.Application.Interfaces.ICurrentUserService currentUserService,
        CancellationToken cancellationToken)
    {
        var currentAdminId = currentUserService.UserId ?? Guid.Empty;
        var result = await authService.ResetStaffPasswordAsync(id, request, currentAdminId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/dependents")]
    [ProducesResponseType(typeof(Daycare.Application.DTOs.Dependents.StaffDependentsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDependents(
        Guid id,
        [FromServices] Daycare.Application.Features.Dependents.IGetStaffDependentsService service,
        CancellationToken cancellationToken)
    {
        var dependents = await service.ExecuteAsync(id, cancellationToken);
        return Ok(dependents);
    }

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(StaffResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deactivate(
        Guid id,
        [FromServices] Daycare.Application.Features.Staff.IDeactivateStaffService service,
        CancellationToken cancellationToken)
    {
        var result = await service.ExecuteAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/reactivate")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(StaffResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reactivate(
        Guid id,
        [FromServices] Daycare.Application.Features.Staff.IReactivateStaffService service,
        CancellationToken cancellationToken)
    {
        var result = await service.ExecuteAsync(id, cancellationToken);
        return Ok(result);
    }
}



