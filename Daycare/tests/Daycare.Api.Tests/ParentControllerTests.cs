using Daycare.Api.Controllers;
using Daycare.Application.DTOs.Attendance;
using Daycare.Application.DTOs.Classrooms;
using Daycare.Application.DTOs.DailyActivities;
using Daycare.Application.DTOs.Enrollment;
using Daycare.Application.DTOs.Guardians;
using Daycare.Application.DTOs.Meals;
using Daycare.Application.DTOs.Parent;
using Daycare.Application.DTOs.Staff;
using Daycare.Application.Features.Attendance;
using Daycare.Application.Features.Classrooms;
using Daycare.Application.Features.ClassroomStaff;
using Daycare.Application.Features.DailyActivities;
using Daycare.Application.Features.Enrollment;
using Daycare.Application.Features.Guardians;
using Daycare.Application.Features.Meals;
using Daycare.Application.Features.Staff;
using Daycare.Domain.Constants;
using Daycare.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Daycare.Api.Tests;

public class ParentControllerTests : IClassFixture<TestFixture>
{
    private readonly TestFixture _fixture;

    public ParentControllerTests(TestFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task GuardianAccountLifecycle_Succeeds()
    {
        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianService = scope.ServiceProvider.GetRequiredService<ICreateGuardianService>();
        var authService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Interfaces.IAuthService>();

        var guardian = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "Bruce",
            LastName = "Wayne",
            Email = $"bruce_{Guid.NewGuid():N}@waynecorp.local",
            Phone = "555-0100",
            Address = "1007 Mountain Drive"
        });

        var guardiansController = _fixture.CreateController<GuardiansController>(role: Roles.Admin);

        // 1. Check account before creation
        var preCheckResult = await guardiansController.GetAccount(guardian.Id, authService, CancellationToken.None);
        var preCheckOk = Assert.IsType<OkObjectResult>(preCheckResult);
        var preStatus = Assert.IsType<GuardianAccountStatusResponse>(preCheckOk.Value);
        Assert.False(preStatus.HasAccount);

        // 2. Create account
        var createResult = await guardiansController.CreateAccount(guardian.Id, authService, CancellationToken.None);
        var createdStatus = Assert.IsType<ObjectResult>(createResult);
        Assert.Equal(201, createdStatus.StatusCode);
        var account = Assert.IsType<CreateGuardianAccountResponse>(createdStatus.Value);
        Assert.Equal("Bruce.wayne1!", account.TemporaryPassword);
        Assert.True(account.MustChangePassword);

        // 3. Reset password
        var resetResult = await guardiansController.ResetAccountPassword(guardian.Id, authService, CancellationToken.None);
        var resetOk = Assert.IsType<OkObjectResult>(resetResult);
        var resetAccount = Assert.IsType<CreateGuardianAccountResponse>(resetOk.Value);
        Assert.Equal("Bruce.wayne1!", resetAccount.TemporaryPassword);

        // 4. Disable account
        var disableResult = await guardiansController.DisableAccount(guardian.Id, authService, CancellationToken.None);
        Assert.IsType<OkObjectResult>(disableResult);

        var statusAfterDisableResult = await guardiansController.GetAccount(guardian.Id, authService, CancellationToken.None);
        var statusAfterDisableOk = Assert.IsType<OkObjectResult>(statusAfterDisableResult);
        var statusAfterDisable = Assert.IsType<GuardianAccountStatusResponse>(statusAfterDisableOk.Value);
        Assert.True(statusAfterDisable.HasAccount);
        Assert.False(statusAfterDisable.IsActive);

        // 5. Enable account
        var enableResult = await guardiansController.EnableAccount(guardian.Id, authService, CancellationToken.None);
        Assert.IsType<OkObjectResult>(enableResult);

        var statusAfterEnableResult = await guardiansController.GetAccount(guardian.Id, authService, CancellationToken.None);
        var statusAfterEnableOk = Assert.IsType<OkObjectResult>(statusAfterEnableResult);
        var statusAfterEnable = Assert.IsType<GuardianAccountStatusResponse>(statusAfterEnableOk.Value);
        Assert.True(statusAfterEnable.IsActive);
    }

    [Fact]
    public async Task ParentProfile_GetAndUpdate_Succeeds()
    {
        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianService = scope.ServiceProvider.GetRequiredService<ICreateGuardianService>();
        var authService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Interfaces.IAuthService>();

        var guardian = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "Selina",
            LastName = "Kyle",
            Email = $"selina_{Guid.NewGuid():N}@gotham.local",
            Phone = "555-0200",
            Address = "Old Gotham East"
        });

        var account = await authService.CreateGuardianUserAccountAsync(guardian.Id);

        var parentController = _fixture.CreateController<ParentController>(
            role: Roles.Parent,
            userId: account.UserId,
            email: guardian.Email,
            guardianId: guardian.Id);

        // 1. Get profile
        var getResult = await parentController.GetProfile(CancellationToken.None);
        var getOk = Assert.IsType<OkObjectResult>(getResult);
        var profile = Assert.IsType<ParentProfileResponse>(getOk.Value);
        Assert.Equal(guardian.Id, profile.GuardianId);
        Assert.Equal("Selina", profile.FirstName);
        Assert.Equal("555-0200", profile.Phone);

        // 2. Update profile
        var updateResult = await parentController.UpdateProfile(new UpdateParentProfileRequest
        {
            Phone = "555-9999",
            Address = "Diamond District Penthouse"
        }, CancellationToken.None);

        var updateOk = Assert.IsType<OkObjectResult>(updateResult);
        var updatedProfile = Assert.IsType<ParentProfileResponse>(updateOk.Value);
        Assert.Equal("555-9999", updatedProfile.Phone);
        Assert.Equal("Diamond District Penthouse", updatedProfile.Address);
    }

    [Fact]
    public async Task ParentChildren_OverviewAndDetails_Succeeds()
    {
        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianService = scope.ServiceProvider.GetRequiredService<ICreateGuardianService>();
        var childService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Children.IRegisterChildService>();
        var classroomService = scope.ServiceProvider.GetRequiredService<ICreateClassroomService>();
        var staffService = scope.ServiceProvider.GetRequiredService<ICreateStaffService>();
        var enrollService = scope.ServiceProvider.GetRequiredService<IEnrollChildService>();
        var assignStaffService = scope.ServiceProvider.GetRequiredService<IAssignStaffToClassroomService>();
        var attendanceService = scope.ServiceProvider.GetRequiredService<IRecordAttendanceService>();
        var mealService = scope.ServiceProvider.GetRequiredService<IRecordMealService>();
        var activityService = scope.ServiceProvider.GetRequiredService<IRecordActivityService>();
        var authService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Interfaces.IAuthService>();

        // 1. Create Guardian and Child
        var guardian = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "Clark",
            LastName = "Kent",
            Email = $"clark_{Guid.NewGuid():N}@dailyplanet.local",
            Phone = "555-0300",
            Address = "Metropolis"
        });

        var child = await childService.ExecuteAsync(new Daycare.Application.DTOs.Children.RegisterChildRequest
        {
            FirstName = "Jon",
            LastName = "Kent",
            DateOfBirth = new DateOnly(2022, 6, 15),
            Gender = "Male",
            GuardianId = guardian.Id,
            Allergies = new List<string> { "Kryptonite" },
            EmergencyContactName = "Lois Lane",
            EmergencyContactPhone = "555-0301",
            PediatricianName = "Dr. Mid-Nite",
            PediatricianPhone = "555-0302"
        });

        // 2. Classroom & Staff
        var classroom = await classroomService.ExecuteAsync(new CreateClassroomRequest
        {
            Name = "Smallville Toddlers",
            Capacity = 12
        });

        var teacher = await staffService.ExecuteAsync(new CreateStaffRequest
        {
            FirstName = "Diana",
            LastName = "Prince",
            Email = $"diana_{Guid.NewGuid():N}@daycare.local",
            Phone = "555-0305",
            Role = StaffRole.Teacher
        });

        await assignStaffService.ExecuteAsync(new Daycare.Application.DTOs.ClassroomStaff.AssignStaffToClassroomRequest
        {
            ClassroomId = classroom.Id,
            StaffId = teacher.Id
        });

        await enrollService.ExecuteAsync(new EnrollChildRequest
        {
            ChildId = child.Id,
            ClassroomId = classroom.Id,
            EnrollmentDate = DateTime.UtcNow
        });

        // 3. Activity, Meal, Attendance for Today
        var now = DateTime.UtcNow;
        await attendanceService.ExecuteAsync(new RecordAttendanceRequest
        {
            ChildId = child.Id,
            RecordedById = teacher.Id,
            ArrivalTime = now.AddHours(-3),
            Status = AttendanceStatus.Present,
            Note = "Super happy morning"
        });

        await mealService.ExecuteAsync(new RecordMealRequest
        {
            ChildId = child.Id,
            StaffId = teacher.Id,
            Food = "Apples & Oat Milk",
            Type = MealType.Breakfast,
            Status = MealStatus.Eaten,
            MealTime = now.AddHours(-2)
        });

        await activityService.ExecuteAsync(new RecordActivityRequest
        {
            ChildId = child.Id,
            RecordedById = teacher.Id,
            ActivityType = ActivityType.Play,
            ActivityDescription = "Building blocks in play zone",
            StartTime = now.AddHours(-1)
        });

        // 4. Create Parent account and invoke ParentController
        var account = await authService.CreateGuardianUserAccountAsync(guardian.Id);

        var parentController = _fixture.CreateController<ParentController>(
            role: Roles.Parent,
            userId: account.UserId,
            email: guardian.Email,
            guardianId: guardian.Id);

        // Test GET /api/parent/children
        var childrenResult = await parentController.GetChildren(CancellationToken.None);
        var childrenOk = Assert.IsType<OkObjectResult>(childrenResult);
        var childrenList = Assert.IsAssignableFrom<IReadOnlyList<ParentChildCardResponse>>(childrenOk.Value);
        Assert.Single(childrenList);
        var card = childrenList[0];
        Assert.Equal(child.Id, card.ChildId);
        Assert.Equal("Jon", card.FirstName);
        Assert.NotNull(card.Classroom);
        Assert.Equal("Smallville Toddlers", card.Classroom.Name);
        Assert.Single(card.PrimaryTeachers);
        Assert.Equal("Diana Prince", card.PrimaryTeachers[0].Name);
        Assert.Equal(AttendanceStatus.Present, card.Today.Status);
        Assert.NotNull(card.Today.CurrentActivity);
        Assert.Equal("Building blocks in play zone", card.Today.CurrentActivity.Description);
        Assert.NotNull(card.Today.LastMeal);
        Assert.Equal((int)MealType.Breakfast, card.Today.LastMeal.Type);

        // Test GET /api/parent/children/{childId}
        var detailResult = await parentController.GetChildDetail(child.Id, CancellationToken.None);
        var detailOk = Assert.IsType<OkObjectResult>(detailResult);
        var detail = Assert.IsType<ParentChildDetailResponse>(detailOk.Value);
        Assert.Equal(child.Id, detail.Id);
        Assert.Equal("Clark Kent", detail.Guardian.Name);
        Assert.NotNull(detail.Enrollment);
        Assert.Equal("Smallville Toddlers", detail.Enrollment.ClassroomName);
        Assert.Contains("Kryptonite", detail.Health.Allergies);
        Assert.Equal("Lois Lane", detail.Health.EmergencyContact?.Name);

        // Test GET /api/parent/children/{childId}/attendance
        var attResult = await parentController.GetChildAttendance(child.Id, null, null, CancellationToken.None);
        var attOk = Assert.IsType<OkObjectResult>(attResult);
        var attList = Assert.IsAssignableFrom<IReadOnlyList<ParentChildAttendanceResponse>>(attOk.Value);
        Assert.Single(attList);
        Assert.Equal(AttendanceStatus.Present, attList[0].Status);
    }

    [Fact]
    public async Task ParentResourceIsolation_ForeignChild_ReturnsNotFound()
    {
        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianService = scope.ServiceProvider.GetRequiredService<ICreateGuardianService>();
        var childService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Children.IRegisterChildService>();
        var authService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Interfaces.IAuthService>();

        // Guardian 1
        var guardianA = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "Parent",
            LastName = "One",
            Email = $"p1_{Guid.NewGuid():N}@family.local",
            Phone = "555-1111",
            Address = "1st Avenue"
        });
        var accountA = await authService.CreateGuardianUserAccountAsync(guardianA.Id);

        // Guardian 2 and Child 2
        var guardianB = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "Parent",
            LastName = "Two",
            Email = $"p2_{Guid.NewGuid():N}@family.local",
            Phone = "555-2222",
            Address = "2nd Avenue"
        });
        var childB = await childService.ExecuteAsync(new Daycare.Application.DTOs.Children.RegisterChildRequest
        {
            FirstName = "Baby",
            LastName = "Two",
            DateOfBirth = new DateOnly(2023, 1, 1),
            Gender = "Female",
            GuardianId = guardianB.Id
        });

        // Controller logged in as Guardian A
        var parentControllerA = _fixture.CreateController<ParentController>(
            role: Roles.Parent,
            userId: accountA.UserId,
            email: guardianA.Email,
            guardianId: guardianA.Id);

        // 1. Parent A attempts to get Parent B's child detail -> throws KeyNotFoundException (maps to 404)
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            parentControllerA.GetChildDetail(childB.Id, CancellationToken.None));

        // 2. Parent A attempts to get Parent B's child attendance -> throws KeyNotFoundException (maps to 404)
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            parentControllerA.GetChildAttendance(childB.Id, null, null, CancellationToken.None));

        // 3. GET /api/parent/children does not list child B
        var childrenResult = await parentControllerA.GetChildren(CancellationToken.None);
        var childrenOk = Assert.IsType<OkObjectResult>(childrenResult);
        var children = Assert.IsAssignableFrom<IReadOnlyList<ParentChildCardResponse>>(childrenOk.Value);
        Assert.DoesNotContain(children, c => c.ChildId == childB.Id);

        // 4. Status, DailyReport, Wellbeing, Absence for foreign child all throw KeyNotFoundException
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            parentControllerA.GetChildStatus(childB.Id, CancellationToken.None));
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            parentControllerA.GetDailyReport(childB.Id, null, CancellationToken.None));
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            parentControllerA.GetWellbeing(childB.Id, null, null, CancellationToken.None));
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            parentControllerA.ReportAbsence(childB.Id, new CreateAbsenceRequest
            {
                FromDate = DateOnly.FromDateTime(DateTime.UtcNow),
                ToDate = DateOnly.FromDateTime(DateTime.UtcNow),
                Reason = 0,
                Details = "Attempt"
            }, CancellationToken.None));
    }

    [Fact]
    public async Task ParentPortal_FullLifecycleEndpoints_Succeed()
    {
        using var scope = _fixture.ServiceProvider.CreateScope();
        var guardianService = scope.ServiceProvider.GetRequiredService<ICreateGuardianService>();
        var childService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Features.Children.IRegisterChildService>();
        var authService = scope.ServiceProvider.GetRequiredService<Daycare.Application.Interfaces.IAuthService>();
        var attendanceService = scope.ServiceProvider.GetRequiredService<IRecordAttendanceService>();
        var mealService = scope.ServiceProvider.GetRequiredService<IRecordMealService>();
        var activityService = scope.ServiceProvider.GetRequiredService<IRecordActivityService>();
        var staffService = scope.ServiceProvider.GetRequiredService<ICreateStaffService>();

        // 1. Setup Guardian, Child, Staff
        var guardian = await guardianService.ExecuteAsync(new CreateGuardianRequest
        {
            FirstName = "Lois",
            LastName = "Lane",
            Email = $"lois_{Guid.NewGuid():N}@dailyplanet.local",
            Phone = "555-8888",
            Address = "Metropolis"
        });
        var account = await authService.CreateGuardianUserAccountAsync(guardian.Id);

        var child = await childService.ExecuteAsync(new Daycare.Application.DTOs.Children.RegisterChildRequest
        {
            FirstName = "Jon",
            LastName = "Kent",
            DateOfBirth = new DateOnly(2022, 6, 1),
            Gender = "Male",
            GuardianId = guardian.Id
        });

        var staff = await staffService.ExecuteAsync(new CreateStaffRequest
        {
            FirstName = "Clark",
            LastName = "Kent",
            Email = $"clark_{Guid.NewGuid():N}@daycare.local",
            Phone = "555-9999",
            Role = StaffRole.Teacher
        });

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var classroomService = scope.ServiceProvider.GetRequiredService<ICreateClassroomService>();
        var enrollService = scope.ServiceProvider.GetRequiredService<IEnrollChildService>();

        var classroom = await classroomService.ExecuteAsync(new CreateClassroomRequest
        {
            Name = "Discovery Toddlers",
            Capacity = 15
        });

        await enrollService.ExecuteAsync(new EnrollChildRequest
        {
            ChildId = child.Id,
            ClassroomId = classroom.Id,
            EnrollmentDate = DateTime.UtcNow.Date.AddDays(-10)
        });

        // Record attendance, meal, activity
        await attendanceService.ExecuteAsync(new RecordAttendanceRequest
        {
            ChildId = child.Id,
            Status = AttendanceStatus.Present,
            ArrivalTime = DateTime.UtcNow.Date.AddHours(8).AddMinutes(30),
            RecordedById = staff.Id
        });

        await mealService.ExecuteAsync(new RecordMealRequest
        {
            ChildId = child.Id,
            Food = "Oatmeal & Blueberries",
            Type = MealType.Breakfast,
            MealTime = DateTime.UtcNow.Date.AddHours(9),
            Status = MealStatus.Eaten,
            StaffId = staff.Id
        });

        await activityService.ExecuteAsync(new RecordActivityRequest
        {
            ChildId = child.Id,
            ActivityType = ActivityType.Play,
            StartTime = DateTime.UtcNow.Date.AddHours(10),
            ActivityDescription = "Building block tower",
            RecordedById = staff.Id
        });

        var controller = _fixture.CreateController<ParentController>(
            role: Roles.Parent,
            userId: account.UserId,
            email: guardian.Email,
            guardianId: guardian.Id);

        // 2. Test GET /api/parent/children/{childId}/status
        var statusResult = await controller.GetChildStatus(child.Id, CancellationToken.None);
        var statusOk = Assert.IsType<OkObjectResult>(statusResult);
        var liveStatus = Assert.IsType<ParentChildLiveStatusResponse>(statusOk.Value);
        Assert.Equal(child.Id, liveStatus.ChildId);
        Assert.Equal("Present", liveStatus.Attendance.Status);
        Assert.Equal(1, liveStatus.Today.Meals.Count);
        Assert.Equal(1, liveStatus.Today.Activities.Count);

        // 3. Test GET /api/parent/children/{childId}/daily-report
        var reportResult = await controller.GetDailyReport(child.Id, today, CancellationToken.None);
        var reportOk = Assert.IsType<OkObjectResult>(reportResult);
        var dailyReport = Assert.IsType<ParentDailyReportResponse>(reportOk.Value);
        Assert.Equal(child.Id, dailyReport.ChildId);
        Assert.True(dailyReport.Timeline.Count >= 2);

        // 4. Test GET /api/parent/children/{childId}/wellbeing
        var wbResult = await controller.GetWellbeing(child.Id, today.AddDays(-7), today, CancellationToken.None);
        var wbOk = Assert.IsType<OkObjectResult>(wbResult);
        var wellbeing = Assert.IsType<ParentWellbeingOverviewResponse>(wbOk.Value);
        Assert.True(wellbeing.Score.Value > 80);

        // 5. Test POST /api/parent/children/{childId}/absence
        var absenceReq = new CreateAbsenceRequest
        {
            FromDate = today.AddDays(1),
            ToDate = today.AddDays(2),
            Reason = 1,
            Details = "Dentist appointment"
        };
        var absResult = await controller.ReportAbsence(child.Id, absenceReq, CancellationToken.None);
        var absCreated = Assert.IsType<ObjectResult>(absResult);
        Assert.Equal(201, absCreated.StatusCode);
        var absResp = Assert.IsType<ParentAbsenceResponse>(absCreated.Value);
        Assert.Equal("Submitted", absResp.Status);

        // 6. Test POST /api/parent/children/{childId}/pickup-notice
        var pickupReq = new CreatePickupNoticeRequest
        {
            PickupPersonName = "Martha Kent",
            Relationship = "Grandmother",
            Phone = "555-4321",
            Date = today,
            EstimatedTime = "04:30 PM",
            Notes = "Has approved ID"
        };
        var pickupResult = await controller.RegisterPickupNotice(child.Id, pickupReq, CancellationToken.None);
        var pickupOk = Assert.IsType<OkObjectResult>(pickupResult);
        var pickupResp = Assert.IsType<ParentPickupNoticeResponse>(pickupOk.Value);
        Assert.Equal("Martha Kent", pickupResp.PickupPersonName);

        // 7. Test POST /api/parent/children/{childId}/home-note
        var noteReq = new CreateHomeNoteRequest
        {
            Category = "Teething",
            Text = "Gave infant soothing drops at 7am.",
            Date = today
        };
        var noteResult = await controller.SubmitHomeNote(child.Id, noteReq, CancellationToken.None);
        var noteCreated = Assert.IsType<ObjectResult>(noteResult);
        Assert.Equal(201, noteCreated.StatusCode);
        var noteResp = Assert.IsType<ParentHomeNoteResponse>(noteCreated.Value);
        Assert.Equal("Teething", noteResp.Category);

        // 8. Test Complaints system
        var compReq = new CreateComplaintRequest
        {
            Category = 3, // Cleanliness
            Subject = "Play area sanitation question",
            Description = "Could staff confirm toys are sanitized after sandbox play?",
            Priority = 1,
            ChildId = child.Id
        };
        var compCreateResult = await controller.CreateComplaint(compReq, CancellationToken.None);
        var compCreated = Assert.IsType<ObjectResult>(compCreateResult);
        Assert.Equal(201, compCreated.StatusCode);
        var complaint = Assert.IsType<ParentComplaintDetailResponse>(compCreated.Value);
        Assert.StartsWith("CMP-", complaint.ReferenceNumber);

        // Add message to complaint thread
        var msgResult = await controller.AddComplaintMessage(complaint.Id, new AddComplaintMessageRequest
        {
            Body = "Thank you for the prompt attention."
        }, CancellationToken.None);
        var msgOk = Assert.IsType<OkObjectResult>(msgResult);
        var updatedComp = Assert.IsType<ParentComplaintDetailResponse>(msgOk.Value);
        Assert.True(updatedComp.Messages.Count >= 2);

        // Rate complaint
        var rateResult = await controller.RateComplaint(complaint.Id, new RateComplaintRequest
        {
            Rating = 5,
            Comment = "Excellent service!"
        }, CancellationToken.None);
        Assert.IsType<NoContentResult>(rateResult);

        // 9. Notifications, Announcements, Consents
        var notifsResult = await controller.GetNotifications(CancellationToken.None);
        var notifsOk = Assert.IsType<OkObjectResult>(notifsResult);
        var notifs = Assert.IsAssignableFrom<IReadOnlyList<ParentNotificationResponse>>(notifsOk.Value);
        Assert.NotEmpty(notifs);

        var annResult = await controller.GetAnnouncements(CancellationToken.None);
        var annOk = Assert.IsType<OkObjectResult>(annResult);
        var announcements = Assert.IsAssignableFrom<IReadOnlyList<ParentAnnouncementResponse>>(annOk.Value);
        Assert.NotEmpty(announcements);

        var consentsResult = await controller.GetConsents(CancellationToken.None);
        var consentsOk = Assert.IsType<OkObjectResult>(consentsResult);
        var consents = Assert.IsAssignableFrom<IReadOnlyList<ParentConsentResponse>>(consentsOk.Value);
        Assert.NotEmpty(consents);

        var respondResult = await controller.RespondConsent(consents[0].Id, new RespondConsentRequest
        {
            Decision = "Granted",
            ChildId = child.Id
        }, CancellationToken.None);
        Assert.IsType<NoContentResult>(respondResult);
    }
}
