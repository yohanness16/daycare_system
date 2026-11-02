using Daycare.Application.DTOs.Incidents;

namespace Daycare.Application.Features.Incidents;

public interface IIncidentService
{
    Task<IncidentResponse> CreateAsync(CreateIncidentRequest request, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<IncidentResponse>> GetAllAsync(Guid? childId = null, Guid? classroomId = null, DateTime? date = null, CancellationToken cancellationToken = default);
    Task<IncidentResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IncidentResponse> AcknowledgeAsync(Guid id, AcknowledgeIncidentRequest request, string? parentUserName = null, CancellationToken cancellationToken = default);
}
