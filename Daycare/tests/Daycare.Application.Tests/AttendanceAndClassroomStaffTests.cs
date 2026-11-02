using Daycare.Application.DTOs.Attendance;
using Daycare.Application.DTOs.ClassroomStaff;
using Daycare.Application.Features.Attendance;
using Daycare.Application.Features.ClassroomStaff;
using Daycare.Domain.Entities;
using Xunit;

namespace Daycare.Application.Tests;

public class AttendanceAndClassroomStaffTests
{
    [Fact]
    public async Task Attendance_CheckInAndCheckOut_WorksCorrectly()
    {
        using var db = TestDbContextFactory.Create();
        var staff = new Staff { Id = Guid.NewGuid(), FirstName = "Maria", LastName = "Teacher" };
        var child = new Child { Id = Guid.NewGuid(), FirstName = "Emma", LastName = "Watson" };
        var room = new Classroom { Id = Guid.NewGuid(), Name = "Butterflies", Capacity = 10 };

        db.Staff.Add(staff);
        db.Children.Add(child);
        db.Classrooms.Add(room);
        db.Enrollments.Add(new Enrollment
        {
            Id = Guid.NewGuid(),
            ChildId = child.Id,
            ClassroomId = room.Id,
            Status = EnrollmentStatus.Active,
            EnrollmentDate = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var recordService = new RecordAttendanceService(db);
        var checkInTime = DateTime.UtcNow.Date.AddHours(8);
        var recordResult = await recordService.ExecuteAsync(new RecordAttendanceRequest
        {
            ChildId = child.Id,
            RecordedById = staff.Id,
            ArrivalTime = checkInTime,
            Note = "Arrived happy"
        });

        Assert.NotNull(recordResult);
        Assert.True(recordResult.IsPresent);
        Assert.Equal(checkInTime, recordResult.ArrivalTime);

        // Now checkout
        var checkOutService = new CheckOutAttendanceService(db);
        var checkOutTime = DateTime.UtcNow.Date.AddHours(16);
        var checkOutResult = await checkOutService.ExecuteAsync(new CheckOutAttendanceRequest
        {
            ChildId = child.Id,
            RecordedById = staff.Id,
            Date = DateOnly.FromDateTime(checkInTime),
            ExitTime = checkOutTime,
            Note = "Picked up by mom"
        });

        Assert.NotNull(checkOutResult);
        Assert.Equal(checkOutTime, checkOutResult.DepartureTime);
        Assert.Contains("Picked up by mom", checkOutResult.Note);
    }

    [Fact]
    public async Task ClassroomStaff_AssignAndRemove_WorksCorrectly()
    {
        using var db = TestDbContextFactory.Create();
        var staff = new Staff { Id = Guid.NewGuid(), FirstName = "David", LastName = "Brown" };
        var room = new Classroom { Id = Guid.NewGuid(), Name = "Stars", Capacity = 15 };

        db.Staff.Add(staff);
        db.Classrooms.Add(room);
        await db.SaveChangesAsync();

        var assignService = new AssignStaffToClassroomService(db);
        var assignment = await assignService.ExecuteAsync(new AssignStaffToClassroomRequest
        {
            ClassroomId = room.Id,
            StaffId = staff.Id
        });

        Assert.NotNull(assignment);
        Assert.True(assignment.IsActive);
        Assert.Equal("Stars", assignment.ClassroomName);
        Assert.Equal("David Brown", assignment.StaffName);

        // Duplicate active assignment throws
        await Assert.ThrowsAsync<InvalidOperationException>(() => assignService.ExecuteAsync(new AssignStaffToClassroomRequest
        {
            ClassroomId = room.Id,
            StaffId = staff.Id
        }));

        // Remove staff
        var removeService = new RemoveStaffFromClassroomService(db);
        var removed = await removeService.ExecuteAsync(assignment.Id);

        Assert.False(removed.IsActive);
        Assert.NotNull(removed.EndedAt);
    }

    [Fact]
    public async Task Attendance_RecordAndCheckOut_WithoutRecordedById_UsesCurrentUserServiceStaffId()
    {
        using var db = TestDbContextFactory.Create();
        var staff = new Staff { Id = Guid.NewGuid(), FirstName = "Elena", LastName = "Rostova" };
        var child = new Child { Id = Guid.NewGuid(), FirstName = "Leo", LastName = "Tolstoy" };
        var room = new Classroom { Id = Guid.NewGuid(), Name = "Robins", Capacity = 12 };

        db.Staff.Add(staff);
        db.Children.Add(child);
        db.Classrooms.Add(room);
        db.Enrollments.Add(new Enrollment
        {
            Id = Guid.NewGuid(),
            ChildId = child.Id,
            ClassroomId = room.Id,
            Status = EnrollmentStatus.Active,
            EnrollmentDate = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var fakeCurrentUserService = new TestCurrentUserService { StaffId = staff.Id };

        // Record attendance with NO RecordedById passed
        var recordService = new RecordAttendanceService(db, fakeCurrentUserService);
        var checkInTime = DateTime.UtcNow.Date.AddHours(9);
        var recordResult = await recordService.ExecuteAsync(new RecordAttendanceRequest
        {
            ChildId = child.Id,
            ArrivalTime = checkInTime,
            Note = "Auto logged-in teacher test"
        });

        Assert.NotNull(recordResult);
        Assert.Equal(staff.Id, recordResult.RecordedById);
        Assert.Equal("Elena Rostova", recordResult.RecordedByName);

        // Checkout with NO RecordedById passed
        var checkOutService = new CheckOutAttendanceService(db, fakeCurrentUserService);
        var checkOutTime = DateTime.UtcNow.Date.AddHours(17);
        var checkOutResult = await checkOutService.ExecuteAsync(new CheckOutAttendanceRequest
        {
            ChildId = child.Id,
            Date = DateOnly.FromDateTime(checkInTime),
            ExitTime = checkOutTime,
            Note = "Auto checked out"
        });

        Assert.NotNull(checkOutResult);
        Assert.Equal(staff.Id, checkOutResult.RecordedById);
        Assert.Equal("Elena Rostova", checkOutResult.RecordedByName);
        Assert.Equal(checkOutTime, checkOutResult.DepartureTime);
    }

    private class TestCurrentUserService : Daycare.Application.Interfaces.ICurrentUserService
    {
        public Guid? UserId { get; set; } = Guid.NewGuid();
        public string? Email { get; set; } = "staff@daycare.local";
        public string? Role { get; set; } = "Staff";
        public Guid? StaffId { get; set; }
        public Guid? GuardianId { get; set; }
        public Guid? ChildId { get; set; }
        public bool IsAuthenticated => true;
        public bool IsAdmin => false;
        public bool IsStaff => true;
        public bool IsParent => false;
    }
}

