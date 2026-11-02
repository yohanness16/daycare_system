using Daycare.Domain.Entities;

namespace Daycare.Application.DTOs.Incidents;

public record IncidentResponse
{
    public Guid Id { get; init; }
    public Guid ChildId { get; init; }
    public string ChildName { get; init; } = string.Empty;
    public string? ChildPhotoUrl { get; init; }
    public Guid? ClassroomId { get; init; }
    public string? ClassroomName { get; init; }
    public Guid ReportedByStaffId { get; init; }
    public string ReportedByStaffName { get; init; } = string.Empty;
    public DateTime IncidentTime { get; init; }
    public string IncidentType { get; init; } = string.Empty;
    public string Location { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string FirstAidAdministered { get; init; } = string.Empty;
    public string? WitnessStaffNames { get; init; }
    public IncidentSeverity Severity { get; init; }
    public string SeverityName => Severity.ToString();
    public bool ParentNotified { get; init; }
    public DateTime? ParentNotifiedAt { get; init; }
    public string ParentNotifiedMethod { get; init; } = string.Empty;
    public bool IsAcknowledgedByParent { get; init; }
    public DateTime? ParentAcknowledgedAt { get; init; }
    public string? ParentSignatureName { get; init; }
    public string? ParentComments { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
