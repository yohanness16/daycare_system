using System.ComponentModel.DataAnnotations;
using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.Incidents;

public record CreateIncidentRequest
{
    [Required]
    public Guid ChildId { get; init; }

    public Guid? ClassroomId { get; init; }

    public Guid? ReportedByStaffId { get; init; }

    public DateTime IncidentTime { get; init; } = DateTime.UtcNow;

    [Required]
    [MaxLength(100)]
    public string IncidentType { get; init; } = "Minor Injury";

    [Required]
    [MaxLength(150)]
    public string Location { get; init; } = "Playground";

    [Required]
    [MaxLength(2000)]
    public string Description { get; init; } = string.Empty;

    [MaxLength(1000)]
    public string FirstAidAdministered { get; init; } = string.Empty;

    [MaxLength(200)]
    public string? WitnessStaffNames { get; init; }

    public IncidentSeverity Severity { get; init; } = IncidentSeverity.Minor;

    public bool ParentNotified { get; init; } = true;

    [MaxLength(50)]
    public string ParentNotifiedMethod { get; init; } = "App";
}
