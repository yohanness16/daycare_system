using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Interfaces;

public interface IDaycareDbContext
{
    DbSet<Guardian> Guardians { get; }
    DbSet<Child> Children { get; }
    DbSet<Staff> Staff { get; }
    DbSet<Classroom> Classrooms { get; }
    DbSet<ClassroomStaff> ClassroomStaff { get; }
    DbSet<Enrollment> Enrollments { get; }
    DbSet<Attendance> Attendances { get; }
    DbSet<Meal> Meals { get; }
    DbSet<DailyActivity> DailyActivities { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<ChildGuardian> ChildGuardians { get; }
    DbSet<ChildAllergy> ChildAllergies { get; }
    DbSet<Conversation> Conversations { get; }
    DbSet<ConversationParticipant> ConversationParticipants { get; }
    DbSet<ChatMessage> ChatMessages { get; }
    DbSet<IncidentReport> Incidents { get; }
    DbSet<AbsenceNotice> AbsenceNotices { get; }
    DbSet<HomeNote> HomeNotes { get; }
    DbSet<ParentComplaint> Complaints { get; }
    DbSet<ComplaintMessage> ComplaintMessages { get; }
    DbSet<ParentNotification> ParentNotifications { get; }
    DbSet<Announcement> Announcements { get; }
    DbSet<ConsentForm> ConsentForms { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
