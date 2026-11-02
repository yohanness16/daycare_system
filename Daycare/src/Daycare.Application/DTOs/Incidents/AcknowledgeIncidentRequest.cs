using System.ComponentModel.DataAnnotations;

namespace Daycare.Application.DTOs.Incidents;

public record AcknowledgeIncidentRequest
{
    [MaxLength(150)]
    public string? ParentSignatureName { get; init; }

    [MaxLength(1000)]
    public string? Comment { get; init; }
}
