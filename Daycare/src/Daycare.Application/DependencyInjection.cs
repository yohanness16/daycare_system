using Daycare.Application.Features.Attendance;
using Daycare.Application.Features.Children;
using Daycare.Application.Features.Classrooms;
using Daycare.Application.Features.ClassroomStaff;
using Daycare.Application.Features.DailyActivities;
using Daycare.Application.Features.Enrollment;
using Daycare.Application.Features.Guardians;
using Daycare.Application.Features.Meals;
using Daycare.Application.Features.Reports;
using Daycare.Application.Features.Staff;
using Microsoft.Extensions.DependencyInjection;

namespace Daycare.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Children
        services.AddScoped<IRegisterChildService, RegisterChildService>();
        services.AddScoped<IGetChildService, GetChildService>();
        services.AddScoped<IGetChildrenService, GetChildrenService>();
        services.AddScoped<IUpdateChildService, UpdateChildService>();
        services.AddScoped<IDeleteChildService, DeleteChildService>();
        services.AddScoped<IGetChildDailyHistoryService, GetChildDailyHistoryService>();

        // Guardians
        services.AddScoped<ICreateGuardianService, CreateGuardianService>();
        services.AddScoped<IGetGuardianService, GetGuardianService>();
        services.AddScoped<IGetGuardiansService, GetGuardiansService>();
        services.AddScoped<IUpdateGuardianService, UpdateGuardianService>();
        services.AddScoped<IDeleteGuardianService, DeleteGuardianService>();

        // Staff
        services.AddScoped<ICreateStaffService, CreateStaffService>();
        services.AddScoped<IGetStaffService, GetStaffService>();
        services.AddScoped<IGetStaffListService, GetStaffListService>();
        services.AddScoped<IUpdateStaffService, UpdateStaffService>();
        services.AddScoped<IDeleteStaffService, DeleteStaffService>();
        services.AddScoped<IDeactivateStaffService, DeactivateStaffService>();
        services.AddScoped<IReactivateStaffService, ReactivateStaffService>();


        // Classrooms
        services.AddScoped<ICreateClassroomService, CreateClassroomService>();
        services.AddScoped<IGetClassroomService, GetClassroomService>();
        services.AddScoped<IGetClassroomsService, GetClassroomsService>();
        services.AddScoped<IUpdateClassroomService, UpdateClassroomService>();
        services.AddScoped<IDeleteClassroomService, DeleteClassroomService>();

        // ClassroomStaff
        services.AddScoped<IAssignStaffToClassroomService, AssignStaffToClassroomService>();
        services.AddScoped<IRemoveStaffFromClassroomService, RemoveStaffFromClassroomService>();
        services.AddScoped<IGetClassroomStaffService, GetClassroomStaffService>();
        services.AddScoped<IGetStaffClassroomsService, GetStaffClassroomsService>();

        // Enrollment
        services.AddScoped<IEnrollChildService, EnrollChildService>();
        services.AddScoped<IGetEnrollmentService, GetEnrollmentService>();
        services.AddScoped<IGetEnrollmentsService, GetEnrollmentsService>();
        services.AddScoped<IGetClassroomEnrollmentsService, GetClassroomEnrollmentsService>();
        services.AddScoped<IGetChildEnrollmentsService, GetChildEnrollmentsService>();
        services.AddScoped<IEndEnrollmentService, EndEnrollmentService>();
        services.AddScoped<ITransferChildClassroomService, TransferChildClassroomService>();

        // Attendance
        services.AddScoped<IRecordAttendanceService, RecordAttendanceService>();
        services.AddScoped<ICheckOutAttendanceService, CheckOutAttendanceService>();
        services.AddScoped<IGetChildAttendanceService, GetChildAttendanceService>();
        services.AddScoped<IGetDailyAttendanceService, GetDailyAttendanceService>();
        services.AddScoped<IGetClassroomDailyAttendanceService, GetClassroomDailyAttendanceService>();

        // Meals
        services.AddScoped<IRecordMealService, RecordMealService>();
        services.AddScoped<IUpdateMealService, UpdateMealService>();
        services.AddScoped<IDeleteMealService, DeleteMealService>();
        services.AddScoped<IGetChildMealsService, GetChildMealsService>();
        services.AddScoped<IGetDailyMealsService, GetDailyMealsService>();

        // Daily Activities
        services.AddScoped<IRecordActivityService, RecordActivityService>();
        services.AddScoped<IUpdateActivityService, UpdateActivityService>();
        services.AddScoped<IDeleteActivityService, DeleteActivityService>();
        services.AddScoped<IGetChildActivitiesService, GetChildActivitiesService>();
        services.AddScoped<IGetDailyActivitiesService, GetDailyActivitiesService>();

        // Dependents
        services.AddScoped<Daycare.Application.Features.Dependents.IGetGuardianDependentsService, Daycare.Application.Features.Dependents.GetGuardianDependentsService>();
        services.AddScoped<Daycare.Application.Features.Dependents.IGetClassroomDependentsService, Daycare.Application.Features.Dependents.GetClassroomDependentsService>();
        services.AddScoped<Daycare.Application.Features.Dependents.IGetStaffDependentsService, Daycare.Application.Features.Dependents.GetStaffDependentsService>();
        services.AddScoped<Daycare.Application.Features.Dependents.IGetChildDependentsService, Daycare.Application.Features.Dependents.GetChildDependentsService>();

        // Parent
        services.AddScoped<Daycare.Application.Features.Parent.IGetParentProfileService, Daycare.Application.Features.Parent.GetParentProfileService>();
        services.AddScoped<Daycare.Application.Features.Parent.IUpdateParentProfileService, Daycare.Application.Features.Parent.UpdateParentProfileService>();
        services.AddScoped<Daycare.Application.Features.Parent.IGetParentChildrenService, Daycare.Application.Features.Parent.GetParentChildrenService>();
        services.AddScoped<Daycare.Application.Features.Parent.IGetParentChildDetailService, Daycare.Application.Features.Parent.GetParentChildDetailService>();
        services.AddScoped<Daycare.Application.Features.Parent.IGetParentChildAttendanceService, Daycare.Application.Features.Parent.GetParentChildAttendanceService>();
        services.AddScoped<Daycare.Application.Features.Parent.IParentPortalService, Daycare.Application.Features.Parent.ParentPortalService>();

        // Reports
        services.AddScoped<IGetDailyReportService, GetDailyReportService>();

        // Chat
        services.AddScoped<Daycare.Application.Features.Chat.IChatService, Daycare.Application.Features.Chat.ChatService>();

        // Incidents
        services.AddScoped<Daycare.Application.Features.Incidents.IIncidentService, Daycare.Application.Features.Incidents.IncidentService>();

        return services;
    }
}

