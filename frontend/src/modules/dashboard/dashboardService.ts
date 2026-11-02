import { ActivityType, MealStatus, MealType } from '../../core/types/enums';
import { attendanceApi } from '../attendance/attendanceApi';
import type { Attendance } from '../attendance/types';
import { childrenApi } from '../children/childrenApi';
import type { Child } from '../children/types';
import { classroomsApi } from '../classrooms/classroomsApi';
import type { Classroom, ClassroomStaffAssignment } from '../classrooms/types';
import { dailyActivitiesApi } from '../daily-activities/dailyActivitiesApi';
import type { DailyActivity } from '../daily-activities/types';
import { enrollmentApi } from '../enrollment/enrollmentApi';
import type { Enrollment } from '../enrollment/types';
import { guardiansApi } from '../guardians/guardiansApi';
import { mealsApi } from '../meals/mealsApi';
import type { Meal } from '../meals/types';
import { staffApi } from '../staff/staffApi';
import type { Staff } from '../staff/types';
import type {
  ActivityDashboardSummary,
  AttendanceOverview,
  ClassroomDashboardItem,
  DashboardData,
  DashboardEvent,
  DashboardStats,
  MealDashboardSummary,
} from './types';

export class DashboardService {
  /**
   * Fetches all underlying domain data and aggregates full dashboard metrics
   */
  async getDashboardData(targetDate?: string): Promise<DashboardData> {
    const date = targetDate || new Date().toISOString().split('T')[0];

    // Concurrently fetch all core domains
    const [
      childrenRes,
      guardiansRes,
      staffRes,
      classroomsRes,
      enrollmentsRes,
      attendanceRes,
      mealsRes,
      activitiesRes,
    ] = await Promise.allSettled([
      childrenApi.getAll(),
      guardiansApi.getAll(),
      staffApi.getAll(),
      classroomsApi.getAll(),
      enrollmentApi.getAll(),
      attendanceApi.getDaily(date),
      mealsApi.getDaily(date),
      dailyActivitiesApi.getDaily(date),
    ]);

    const children: Child[] = childrenRes.status === 'fulfilled' ? childrenRes.value : [];
    const guardians = guardiansRes.status === 'fulfilled' ? guardiansRes.value : [];
    const staff: Staff[] = staffRes.status === 'fulfilled' ? staffRes.value : [];
    const classrooms: Classroom[] = classroomsRes.status === 'fulfilled' ? classroomsRes.value : [];
    const enrollments: Enrollment[] =
      enrollmentsRes.status === 'fulfilled' ? enrollmentsRes.value : [];
    const attendanceRecords: Attendance[] =
      attendanceRes.status === 'fulfilled' ? attendanceRes.value : [];
    const meals: Meal[] = mealsRes.status === 'fulfilled' ? mealsRes.value : [];
    const activities: DailyActivity[] =
      activitiesRes.status === 'fulfilled' ? activitiesRes.value : [];

    // Fetch classroom staff assignments concurrently for each classroom
    const classroomStaffMap: Record<string, ClassroomStaffAssignment[]> = {};
    if (classrooms.length > 0) {
      const staffAssignmentsRes = await Promise.allSettled(
        classrooms.map((c) => classroomsApi.getStaffByClassroom(c.id, true))
      );
      staffAssignmentsRes.forEach((res, index) => {
        const room = classrooms[index];
        if (room && res.status === 'fulfilled') {
          classroomStaffMap[room.id] = res.value;
        }
      });
    }

    // Active Enrollments
    const activeEnrollments = enrollments.filter((e) => e.status === 'Active');
    const childClassroomMap = new Map<string, { id: string; name: string }>();
    activeEnrollments.forEach((e) => {
      childClassroomMap.set(e.childId, { id: e.classroomId, name: e.classroomName });
    });

    // Attendance Breakdown
    const stillPresentList = attendanceRecords.filter((a) => a.isPresent && !a.departureTime);
    const checkedOutList = attendanceRecords.filter((a) => !!a.departureTime);
    const presentTodayCount = stillPresentList.length;
    const checkedOutTodayCount = checkedOutList.length;
    const totalAttendedCount = attendanceRecords.filter((a) => a.isPresent).length;

    const attendedChildIds = new Set(attendanceRecords.filter((a) => a.isPresent).map((a) => a.childId));
    const activeEnrolledChildIds = new Set(activeEnrollments.map((e) => e.childId));

    const absentChildren = children.filter(
      (c) => activeEnrolledChildIds.has(c.id) && !attendedChildIds.has(c.id)
    );
    const absentTodayCount = absentChildren.length;

    const attendanceRate =
      activeEnrollments.length > 0
        ? Math.min(100, Math.round((totalAttendedCount / activeEnrollments.length) * 100))
        : 0;

    // Capacity & Occupancy
    const totalClassroomCapacity = classrooms.reduce((sum, c) => sum + (c.capacity || 0), 0);
    const overallOccupancyPercentage =
      totalClassroomCapacity > 0
        ? Math.min(100, Math.round((activeEnrollments.length / totalClassroomCapacity) * 100))
        : 0;

    // Ill / Health Alert Detection
    const healthAlerts = activities.filter(
      (a) =>
        a.activityType === ActivityType.Ill ||
        a.activityDescription.toLowerCase().includes('sick') ||
        a.activityDescription.toLowerCase().includes('injury') ||
        a.activityDescription.toLowerCase().includes('fever')
    );

    const uneatenAlerts = meals.filter((m) => m.status === MealStatus.NotEaten);

    // Classroom Breakdowns
    const classroomDashboardItems: ClassroomDashboardItem[] = classrooms.map((room) => {
      const roomEnrollments = activeEnrollments.filter((e) => e.classroomId === room.id);
      const enrolledCount = roomEnrollments.length;
      const capacity = room.capacity || 1;
      const occupancyRate = Math.round((enrolledCount / capacity) * 100);

      // Present children enrolled in this classroom
      const roomEnrolledChildIds = new Set(roomEnrollments.map((e) => e.childId));
      const roomPresentCount = stillPresentList.filter((a) =>
        roomEnrolledChildIds.has(a.childId)
      ).length;

      const assignments = classroomStaffMap[room.id] || [];
      const assignedStaff = assignments.map((a) => ({
        id: a.staffId,
        name: a.staffName,
        role: 'Teacher',
      }));

      // Ratio
      const staffCount = assignedStaff.length;
      const staffToChildRatio =
        staffCount > 0 ? `1:${Math.max(1, Math.round(roomPresentCount / staffCount))}` : 'No Staff';

      // Status
      let status: ClassroomDashboardItem['status'] = 'Normal';
      if (enrolledCount > capacity) {
        status = 'Over Capacity';
      } else if (enrolledCount === capacity) {
        status = 'At Capacity';
      } else if (occupancyRate >= 80) {
        status = 'Near Capacity';
      } else if (occupancyRate < 40) {
        status = 'Underenrolled';
      }

      return {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        enrolledCount,
        occupancyRate,
        presentCount: roomPresentCount,
        assignedStaff,
        staffToChildRatio,
        status,
      };
    });

    // Attendance Overview Object
    const attendanceOverview: AttendanceOverview = {
      totalExpected: activeEnrollments.length,
      presentCount: presentTodayCount,
      checkedOutCount: checkedOutTodayCount,
      absentCount: absentTodayCount,
      attendanceRate,
      recentCheckIns: [...attendanceRecords]
        .filter((a) => a.arrivalTime)
        .sort((a, b) => new Date(b.arrivalTime || 0).getTime() - new Date(a.arrivalTime || 0).getTime())
        .slice(0, 5),
      recentCheckOuts: [...checkedOutList]
        .sort((a, b) => new Date(b.departureTime || 0).getTime() - new Date(a.departureTime || 0).getTime())
        .slice(0, 5),
      stillPresentList,
      unrecordedChildren: absentChildren.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        classroomName: childClassroomMap.get(c.id)?.name,
      })),
    };

    // Meal Summary
    const mealByType = {
      Breakfast: meals.filter((m) => m.type === MealType.Breakfast).length,
      Lunch: meals.filter((m) => m.type === MealType.Lunch).length,
      Snack: meals.filter((m) => m.type === MealType.Snack).length,
      Dinner: meals.filter((m) => m.type === MealType.Dinner).length,
      Other: meals.filter((m) => m.type === MealType.Other).length,
    };

    const mealByStatus = {
      Eaten: meals.filter((m) => m.status === MealStatus.Eaten).length,
      PartiallyEaten: meals.filter((m) => m.status === MealStatus.PartiallyEaten).length,
      NotEaten: meals.filter((m) => m.status === MealStatus.NotEaten).length,
    };

    const mealSummary: MealDashboardSummary = {
      totalLogged: meals.length,
      byType: mealByType,
      byStatus: mealByStatus,
      uneatenAlerts,
      recentMeals: [...meals]
        .sort((a, b) => new Date(b.mealTime).getTime() - new Date(a.mealTime).getTime())
        .slice(0, 5),
    };

    // Activity Summary
    const activityByType: Record<ActivityType, number> = {
      [ActivityType.Learning]: meals.length,
      [ActivityType.Play]: 0,
      [ActivityType.Nap]: 0,
      [ActivityType.Outdoor]: 0,
      [ActivityType.Art]: 0,
      [ActivityType.Music]: 0,
      [ActivityType.Playing]: 0,
      [ActivityType.Sleeping]: 0,
      [ActivityType.Resting]: 0,
      [ActivityType.Eating]: 0,
      [ActivityType.Ill]: 0,
      [ActivityType.Other]: 0,
    };

    Object.values(ActivityType).forEach((type) => {
      activityByType[type] = activities.filter((a) => a.activityType === type).length;
    });

    const activitySummary: ActivityDashboardSummary = {
      totalLogged: activities.length,
      byType: activityByType,
      healthAlerts,
      recentActivities: [...activities]
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 5),
    };

    // Unified Event Timeline Construction
    const events: DashboardEvent[] = [];

    // Attendance events
    attendanceRecords.forEach((a) => {
      if (a.arrivalTime) {
        events.push({
          id: `checkin-${a.id}`,
          timestamp: a.arrivalTime,
          timeFormatted: new Date(a.arrivalTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          category: 'attendance',
          severity: 'success',
          title: `Arrival Check-In: ${a.childName}`,
          subtitle: a.note ? `Note: ${a.note}` : 'Checked in by staff',
          childId: a.childId,
          childName: a.childName,
        });
      }
      if (a.departureTime) {
        events.push({
          id: `checkout-${a.id}`,
          timestamp: a.departureTime,
          timeFormatted: new Date(a.departureTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          category: 'attendance',
          severity: 'info',
          title: `Departure: ${a.childName}`,
          subtitle: a.note ? `Checkout note: ${a.note}` : 'Checked out',
          childId: a.childId,
          childName: a.childName,
        });
      }
    });

    // Meal events
    meals.forEach((m) => {
      const isAlert = m.status === MealStatus.NotEaten;
      events.push({
        id: `meal-${m.id}`,
        timestamp: m.mealTime,
        timeFormatted: new Date(m.mealTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        category: 'meal',
        severity: isAlert ? 'warning' : 'info',
        title: `${m.type}: ${m.childName}`,
        subtitle: `${m.food} (${m.status})${m.notes ? ` — ${m.notes}` : ''}`,
        childId: m.childId,
        childName: m.childName,
      });
    });

    // Activity events
    activities.forEach((act) => {
      const isIll = act.activityType === ActivityType.Ill;
      events.push({
        id: `activity-${act.id}`,
        timestamp: act.startTime,
        timeFormatted: new Date(act.startTime).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        category: 'activity',
        severity: isIll ? 'alert' : 'info',
        title: `${act.activityType}: ${act.childName}`,
        subtitle: `${act.activityDescription}${act.note ? ` — ${act.note}` : ''}`,
        childId: act.childId,
        childName: act.childName,
      });
    });

    // Sort timeline descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Stats Object
    const stats: DashboardStats = {
      totalChildren: children.length,
      totalGuardians: guardians.length,
      totalClassrooms: classrooms.length,
      totalStaff: staff.length,
      presentTodayCount,
      checkedOutTodayCount,
      absentTodayCount,
      attendanceRate,
      activeEnrollmentsCount: activeEnrollments.length,
      totalClassroomCapacity,
      overallOccupancyPercentage,
      mealsLoggedTodayCount: meals.length,
      activitiesLoggedTodayCount: activities.length,
      alertCount: healthAlerts.length + uneatenAlerts.length,
    };

    return {
      date,
      stats,
      classrooms: classroomDashboardItems,
      attendance: attendanceOverview,
      meals: mealSummary,
      activities: activitySummary,
      eventTimeline: events.slice(0, 30), // top 30 most recent events
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const dashboardService = new DashboardService();
