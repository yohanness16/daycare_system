using Daycare.Application.DTOs.Guardians;
using Daycare.Application.Features.Guardians;
using Daycare.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Daycare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GuardiansController : ControllerBase
{
    private readonly ICreateGuardianService _createService;
    private readonly IGetGuardianService _getService;
    private readonly IGetGuardiansService _getAllService;
    private readonly IUpdateGuardianService _updateService;
    private readonly IDeleteGuardianService _deleteService;

    public GuardiansController(
        ICreateGuardianService createService,
        IGetGuardianService getService,
        IGetGuardiansService getAllService,
        IUpdateGuardianService updateService,
        IDeleteGuardianService deleteService)
    {
        _createService = createService;
        _getService = getService;
        _getAllService = getAllService;
        _updateService = updateService;
        _deleteService = deleteService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<GuardianResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] string? searchTerm, CancellationToken cancellationToken)
    {
        var guardians = await _getAllService.ExecuteAsync(searchTerm, cancellationToken);
        return Ok(guardians);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(GuardianResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var guardian = await _getService.ExecuteAsync(id, cancellationToken);
        if (guardian is null)
            return NotFound(new { message = $"Guardian with ID '{id}' was not found." });

        return Ok(guardian);
    }

    [HttpPost]
    [ProducesResponseType(typeof(GuardianResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateGuardianRequest request, CancellationToken cancellationToken)
    {
        var guardian = await _createService.ExecuteAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = guardian.Id }, guardian);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(GuardianResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateGuardianRequest request, CancellationToken cancellationToken)
    {
        var guardian = await _updateService.ExecuteAsync(id, request, cancellationToken);
        return Ok(guardian);
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
        var guardian = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
            db.Guardians, g => g.Id == id, cancellationToken);
        if (guardian is null)
            return NotFound(new { message = $"Guardian with ID '{id}' was not found." });

        guardian.PhotoUrl = request.PhotoUrl;
        guardian.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return Ok(new { guardian.Id, guardian.PhotoUrl });
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
    [ProducesResponseType(typeof(Daycare.Application.DTOs.Dependents.GuardianDependentsResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDependents(
        Guid id,
        [FromServices] Daycare.Application.Features.Dependents.IGetGuardianDependentsService service,
        CancellationToken cancellationToken)
    {
        var dependents = await service.ExecuteAsync(id, cancellationToken);
        return Ok(dependents);
    }

    [HttpPost("{id:guid}/create-account")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Staff}")]
    [ProducesResponseType(typeof(Daycare.Application.DTOs.Guardians.CreateGuardianAccountResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateAccount(
        Guid id,
        [FromServices] Daycare.Application.Interfaces.IAuthService authService,
        CancellationToken cancellationToken)
    {
        var result = await authService.CreateGuardianUserAccountAsync(id, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPost("{id:guid}/reset-account-password")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Staff}")]
    [ProducesResponseType(typeof(Daycare.Application.DTOs.Guardians.CreateGuardianAccountResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetAccountPassword(
        Guid id,
        [FromServices] Daycare.Application.Interfaces.IAuthService authService,
        CancellationToken cancellationToken)
    {
        var result = await authService.ResetGuardianPasswordAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/disable-account")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DisableAccount(
        Guid id,
        [FromServices] Daycare.Application.Interfaces.IAuthService authService,
        CancellationToken cancellationToken)
    {
        await authService.DisableGuardianAccountAsync(id, cancellationToken);
        return Ok(new { message = "Guardian account has been disabled." });
    }

    [HttpPost("{id:guid}/enable-account")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EnableAccount(
        Guid id,
        [FromServices] Daycare.Application.Interfaces.IAuthService authService,
        CancellationToken cancellationToken)
    {
        await authService.EnableGuardianAccountAsync(id, cancellationToken);
        return Ok(new { message = "Guardian account has been enabled." });
    }

    [HttpGet("{id:guid}/account")]
    [Authorize(Roles = $"{Roles.Admin},{Roles.Staff}")]
    [ProducesResponseType(typeof(Daycare.Application.DTOs.Guardians.GuardianAccountStatusResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAccount(
        Guid id,
        [FromServices] Daycare.Application.Interfaces.IAuthService authService,
        CancellationToken cancellationToken)
    {
        var result = await authService.GetGuardianAccountAsync(id, cancellationToken);
        return Ok(result);
    }
}

