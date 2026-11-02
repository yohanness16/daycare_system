using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Daycare.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Infrastructure.Persistence;

public class DaycareDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>, IDaycareDbContext
{
    public DaycareDbContext(DbContextOptions<DaycareDbContext> options)
        : base(options)
    {
    }

    public DbSet<Guardian> Guardians { get; set; } = null!;
    public DbSet<Child> Children { get; set; } = null!;
    public DbSet<Staff> Staff { get; set; } = null!;
    public DbSet<Classroom> Classrooms { get; set; } = null!;
    public DbSet<ClassroomStaff> ClassroomStaff { get; set; } = null!;
    public DbSet<Enrollment> Enrollments { get; set; } = null!;
    public DbSet<Attendance> Attendances { get; set; } = null!;
    public DbSet<Meal> Meals { get; set; } = null!;
    public DbSet<DailyActivity> DailyActivities { get; set; } = null!;
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
    public DbSet<ChildGuardian> ChildGuardians { get; set; } = null!;
    public DbSet<ChildAllergy> ChildAllergies { get; set; } = null!;
    public DbSet<Conversation> Conversations { get; set; } = null!;
    public DbSet<ConversationParticipant> ConversationParticipants { get; set; } = null!;
    public DbSet<ChatMessage> ChatMessages { get; set; } = null!;
    public DbSet<IncidentReport> Incidents { get; set; } = null!;
    public DbSet<AbsenceNotice> AbsenceNotices { get; set; } = null!;
    public DbSet<HomeNote> HomeNotes { get; set; } = null!;
    public DbSet<ParentComplaint> Complaints { get; set; } = null!;
    public DbSet<ComplaintMessage> ComplaintMessages { get; set; } = null!;
    public DbSet<ParentNotification> ParentNotifications { get; set; } = null!;
    public DbSet<Announcement> Announcements { get; set; } = null!;
    public DbSet<ConsentForm> ConsentForms { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User -> Staff
        modelBuilder.Entity<ApplicationUser>()
            .HasOne(u => u.Staff)
            .WithMany()
            .HasForeignKey(u => u.StaffId)
            .OnDelete(DeleteBehavior.SetNull);

        // User -> Guardian
        modelBuilder.Entity<ApplicationUser>()
            .HasOne(u => u.Guardian)
            .WithMany()
            .HasForeignKey(u => u.GuardianId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ApplicationUser>()
            .HasIndex(u => u.GuardianId)
            .HasFilter("\"GuardianId\" IS NOT NULL");

        // User -> Child (Child Credential Portal Login)
        modelBuilder.Entity<ApplicationUser>()
            .HasOne(u => u.Child)
            .WithMany()
            .HasForeignKey(u => u.ChildId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ApplicationUser>()
            .HasIndex(u => u.ChildId)
            .HasFilter("\"ChildId\" IS NOT NULL");

        // RefreshToken
        modelBuilder.Entity<RefreshToken>()
            .HasIndex(rt => rt.Token)
            .IsUnique();

        modelBuilder.Entity<RefreshToken>()
            .HasIndex(rt => rt.UserId);

        // Child -> Guardian
        modelBuilder.Entity<Child>()
            .HasOne(c => c.Guardian)
            .WithMany()
            .HasForeignKey(c => c.GuardianId)
            .OnDelete(DeleteBehavior.Restrict);

        // Enrollment
        modelBuilder.Entity<Enrollment>()
            .HasOne(e => e.Child)
            .WithMany()
            .HasForeignKey(e => e.ChildId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Enrollment>()
            .HasOne(e => e.Classroom)
            .WithMany()
            .HasForeignKey(e => e.ClassroomId)
            .OnDelete(DeleteBehavior.Restrict);

        // ClassroomStaff
        modelBuilder.Entity<ClassroomStaff>()
            .HasOne(cs => cs.Classroom)
            .WithMany()
            .HasForeignKey(cs => cs.ClassroomId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClassroomStaff>()
            .HasOne(cs => cs.Staff)
            .WithMany()
            .HasForeignKey(cs => cs.StaffId)
            .OnDelete(DeleteBehavior.Cascade);

        // Attendance
        modelBuilder.Entity<Attendance>()
            .HasOne(a => a.Child)
            .WithMany()
            .HasForeignKey(a => a.ChildId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Attendance>()
            .HasOne(a => a.RecordedBy)
            .WithMany()
            .HasForeignKey(a => a.RecordedById)
            .OnDelete(DeleteBehavior.SetNull);

        // Meal
        modelBuilder.Entity<Meal>()
            .HasOne(m => m.Child)
            .WithMany()
            .HasForeignKey(m => m.ChildId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Meal>()
            .HasOne(m => m.Staff)
            .WithMany()
            .HasForeignKey(m => m.StaffId)
            .OnDelete(DeleteBehavior.Restrict);

        // DailyActivity
        modelBuilder.Entity<DailyActivity>()
            .HasOne(da => da.Child)
            .WithMany()
            .HasForeignKey(da => da.ChildId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DailyActivity>()
            .HasOne(da => da.RecordedBy)
            .WithMany()
            .HasForeignKey(da => da.RecordedById)
            .OnDelete(DeleteBehavior.SetNull);

        // ChildGuardian (Many-to-Many Child <-> Guardian)
        modelBuilder.Entity<ChildGuardian>(b =>
        {
            b.HasKey(cg => cg.Id);

            b.HasOne(cg => cg.Child)
                .WithMany(c => c.Guardians)
                .HasForeignKey(cg => cg.ChildId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(cg => cg.Guardian)
                .WithMany(g => g.ChildGuardians)
                .HasForeignKey(cg => cg.GuardianId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(cg => new { cg.ChildId, cg.GuardianId });
        });

        // ChildAllergy
        modelBuilder.Entity<ChildAllergy>(b =>
        {
            b.HasKey(ca => ca.Id);

            b.HasOne(ca => ca.Child)
                .WithMany(c => c.ChildAllergies)
                .HasForeignKey(ca => ca.ChildId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(ca => ca.ChildId);
        });

        // Conversation
        modelBuilder.Entity<Conversation>(b =>
        {
            b.HasKey(c => c.Id);
            b.HasOne(c => c.Child)
                .WithMany()
                .HasForeignKey(c => c.ChildId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(c => c.Classroom)
                .WithMany()
                .HasForeignKey(c => c.ClassroomId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasIndex(c => c.ChildId);
            b.HasIndex(c => c.ClassroomId);
        });

        // ConversationParticipant
        modelBuilder.Entity<ConversationParticipant>(b =>
        {
            b.HasKey(cp => cp.Id);
            b.HasOne(cp => cp.Conversation)
                .WithMany(c => c.Participants)
                .HasForeignKey(cp => cp.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(cp => new { cp.ConversationId, cp.UserId });
        });

        // ChatMessage
        modelBuilder.Entity<ChatMessage>(b =>
        {
            b.HasKey(cm => cm.Id);
            b.HasOne(cm => cm.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(cm => cm.ConversationId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(cm => cm.ReplyToMessage)
                .WithMany()
                .HasForeignKey(cm => cm.ReplyToMessageId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasIndex(cm => cm.ConversationId);
            b.HasIndex(cm => cm.CreatedAt);
        });

        // IncidentReport
        modelBuilder.Entity<IncidentReport>(b =>
        {
            b.HasKey(ir => ir.Id);

            b.HasOne(ir => ir.Child)
                .WithMany()
                .HasForeignKey(ir => ir.ChildId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(ir => ir.ReportedByStaff)
                .WithMany()
                .HasForeignKey(ir => ir.ReportedByStaffId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(ir => ir.Classroom)
                .WithMany()
                .HasForeignKey(ir => ir.ClassroomId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasIndex(ir => ir.ChildId);
            b.HasIndex(ir => ir.IncidentTime);
        });

        // AbsenceNotice
        modelBuilder.Entity<AbsenceNotice>(b =>
        {
            b.HasKey(a => a.Id);
            b.HasOne(a => a.Child)
                .WithMany()
                .HasForeignKey(a => a.ChildId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(a => a.Guardian)
                .WithMany()
                .HasForeignKey(a => a.GuardianId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasIndex(a => a.ChildId);
        });

        // HomeNote
        modelBuilder.Entity<HomeNote>(b =>
        {
            b.HasKey(hn => hn.Id);
            b.HasOne(hn => hn.Child)
                .WithMany()
                .HasForeignKey(hn => hn.ChildId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(hn => hn.Guardian)
                .WithMany()
                .HasForeignKey(hn => hn.GuardianId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasIndex(hn => new { hn.ChildId, hn.Date });
        });

        // ParentComplaint & ComplaintMessage
        modelBuilder.Entity<ParentComplaint>(b =>
        {
            b.HasKey(pc => pc.Id);
            b.HasOne(pc => pc.Guardian)
                .WithMany()
                .HasForeignKey(pc => pc.GuardianId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(pc => pc.Child)
                .WithMany()
                .HasForeignKey(pc => pc.ChildId)
                .OnDelete(DeleteBehavior.SetNull);
            b.HasMany(pc => pc.Messages)
                .WithOne(m => m.Complaint)
                .HasForeignKey(m => m.ComplaintId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(pc => pc.GuardianId);
            b.HasIndex(pc => pc.ReferenceNumber);
        });

        modelBuilder.Entity<ComplaintMessage>(b =>
        {
            b.HasKey(cm => cm.Id);
            b.HasOne(cm => cm.Complaint)
                .WithMany(c => c.Messages)
                .HasForeignKey(cm => cm.ComplaintId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(cm => cm.ComplaintId);
        });

        modelBuilder.Entity<ParentNotification>(b =>
        {
            b.HasKey(pn => pn.Id);
            b.HasIndex(pn => new { pn.GuardianId, pn.IsRead });
        });

        modelBuilder.Entity<Announcement>(b =>
        {
            b.HasKey(a => a.Id);
            b.HasIndex(a => a.PublishedAt);
        });

        modelBuilder.Entity<ConsentForm>(b =>
        {
            b.HasKey(cf => cf.Id);
            b.HasIndex(cf => cf.ChildId);
        });
    }
}