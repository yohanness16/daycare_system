using System.Security.Claims;
using Daycare.Api.Hubs;
using Daycare.Application.DTOs.Incidents;
using Daycare.Application.Features.Incidents;
using Daycare.Application.Interfaces;
using Daycare.Domain.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace Daycare.Api.Controllers;

[ApiController]
[Authorize]
public class IncidentsController : ControllerBase
{
    private readonly IIncidentService _incidentService;
    private readonly IHubContext<DaycareHub> _hubContext;
    private readonly ICurrentUserService _currentUserService;

    public IncidentsController(
        IIncidentService incidentService,
        IHubContext<DaycareHub> hubContext,
        ICurrentUserService currentUserService)
    {
        _incidentService = incidentService ?? throw new ArgumentNullException(nameof(incidentService));
        _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
    }

    private (Guid userId, string userName) ResolveCurrentUser()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var userId = Guid.TryParse(userIdStr, out var id) ? id : (_currentUserService.UserId ?? Guid.Empty);
        var userName = User.FindFirstValue("firstName") ?? User.Identity?.Name ?? "User";
        return (userId, userName);
    }

    [HttpPost("api/incidents")]
    [ProducesResponseType(typeof(IncidentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Create(
        [FromBody] CreateIncidentRequest request,
        CancellationToken cancellationToken)
    {
        var (userId, _) = ResolveCurrentUser();
        try
        {
            var result = await _incidentService.CreateAsync(request, userId, cancellationToken);

            // Notify real-time subscribers (Parents, Educators, Admins)
            await _hubContext.Clients.All.SendAsync("IncidentReported", result, cancellationToken);
            await _hubContext.Clients.All.SendAsync("HealthAlertCreated", new
            {
                Id = result.Id,
                Type = "Incident",
                ChildId = result.ChildId,
                ChildName = result.ChildName,
                Title = $"{result.IncidentType} - {result.ChildName}",
                Severity = result.SeverityName,
                Time = result.IncidentTime,
                Description = result.Description
            }, cancellationToken);

            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("api/incidents")]
    [ProducesResponseType(typeof(IReadOnlyList<IncidentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? childId,
        [FromQuery] Guid? classroomId,
        [FromQuery] DateTime? date,
        CancellationToken cancellationToken)
    {
        var list = await _incidentService.GetAllAsync(childId, classroomId, date, cancellationToken);
        return Ok(list);
    }

    [HttpGet("api/incidents/{id:guid}")]
    [HttpGet("api/parent/incidents/{id:guid}")]
    [ProducesResponseType(typeof(IncidentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var incident = await _incidentService.GetByIdAsync(id, cancellationToken);
        if (incident is null)
            return NotFound(new { message = $"Incident with ID '{id}' was not found." });

        return Ok(incident);
    }

    [HttpGet("api/incidents/child/{childId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<IncidentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByChild(Guid childId, CancellationToken cancellationToken)
    {
        var list = await _incidentService.GetAllAsync(childId: childId, cancellationToken: cancellationToken);
        return Ok(list);
    }

    [HttpPost("api/incidents/{id:guid}/acknowledge")]
    [HttpPost("api/parent/incidents/{id:guid}/acknowledge")]
    [ProducesResponseType(typeof(IncidentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Acknowledge(
        Guid id,
        [FromBody] AcknowledgeIncidentRequest request,
        CancellationToken cancellationToken)
    {
        var (_, userName) = ResolveCurrentUser();
        try
        {
            var result = await _incidentService.AcknowledgeAsync(id, request, userName, cancellationToken);

            // Notify real-time subscribers
            await _hubContext.Clients.All.SendAsync("IncidentAcknowledged", result, cancellationToken);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
