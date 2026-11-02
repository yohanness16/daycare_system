import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider, useAuth } from './core/auth/AuthContext';
import { ProtectedRoute } from './core/auth/ProtectedRoute';
import { LanguageProvider } from './core/i18n/LanguageContext';
import { ThemeProvider } from './core/theme/ThemeContext';

// Pages
import { LoginPage } from './modules/auth/pages/LoginPage';
import { ChangePasswordPage } from './modules/auth/pages/ChangePasswordPage';
import { TodayBoardPage } from './modules/attendance/pages/TodayBoardPage';
import { DashboardPage } from './modules/dashboard/pages/DashboardPage';
import { DailyReportsPage } from './modules/dashboard/pages/DailyReportsPage';
import { ChildrenListPage } from './modules/children/pages/ChildrenListPage';
import { ChildDetailPage } from './modules/children/pages/ChildDetailPage';
import { ChildHistoryPage } from './modules/children/pages/ChildHistoryPage';
import { RegisterChildPage } from './modules/children/pages/RegisterChildPage';
import { GuardiansListPage } from './modules/guardians/pages/GuardiansListPage';
import { GuardianDetailPage } from './modules/guardians/pages/GuardianDetailPage';
import { ClassroomsListPage } from './modules/classrooms/pages/ClassroomsListPage';
import { ClassroomDetailPage } from './modules/classrooms/pages/ClassroomDetailPage';
import { EnrollmentListPage } from './modules/enrollment/pages/EnrollmentListPage';
import { StaffListPage } from './modules/staff/pages/StaffListPage';
import { StaffDetailPage } from './modules/staff/pages/StaffDetailPage';
import { DailyAttendancePage } from './modules/attendance/pages/DailyAttendancePage';
import { ChildAttendancePage } from './modules/attendance/pages/ChildAttendancePage';
import { MealsPage } from './modules/meals/pages/MealsPage';
import { DailyActivitiesPage } from './modules/daily-activities/pages/DailyActivitiesPage';
import { ProfilePage } from './modules/settings/pages/ProfilePage';
import { SettingsPage } from './modules/settings/pages/SettingsPage';

// Parent Portal Imports
import { ParentChildProvider } from './modules/parent/context/ParentChildContext';
import { ParentLayout } from './modules/parent/components/ParentLayout';
import { ParentChangePasswordPage } from './modules/parent/pages/ParentChangePasswordPage';
import { ParentWelcomePage } from './modules/parent/pages/ParentWelcomePage';
import { ParentTodayPage } from './modules/parent/pages/ParentTodayPage';
import { ParentChildrenListPage } from './modules/parent/pages/ParentChildrenListPage';
import { ParentChildHubPage } from './modules/parent/pages/ParentChildHubPage';
import { ParentChildProfilePage } from './modules/parent/pages/ParentChildProfilePage';
import { ParentDailyStoryPage } from './modules/parent/pages/ParentDailyStoryPage';
import { ParentWellbeingPage } from './modules/parent/pages/ParentWellbeingPage';
import { ParentPhotosPage } from './modules/parent/pages/ParentPhotosPage';
import { ParentAbsencePage } from './modules/parent/pages/ParentAbsencePage';
import { ParentPickupPage } from './modules/parent/pages/ParentPickupPage';
import { ParentHomeNotePage } from './modules/parent/pages/ParentHomeNotePage';
import { ParentMessagesPage } from './modules/parent/pages/ParentMessagesPage';
import { ParentChatThreadPage } from './modules/parent/pages/ParentChatThreadPage';
import { ParentNewMessagePage } from './modules/parent/pages/ParentNewMessagePage';
import { ParentComplaintsListPage } from './modules/parent/pages/ParentComplaintsListPage';
import { ParentNewComplaintPage } from './modules/parent/pages/ParentNewComplaintPage';
import { ParentComplaintDetailPage } from './modules/parent/pages/ParentComplaintDetailPage';
import { ParentIncidentDetailPage } from './modules/parent/pages/ParentIncidentDetailPage';
import { ParentNotificationsPage } from './modules/parent/pages/ParentNotificationsPage';
import { ParentAnnouncementsPage } from './modules/parent/pages/ParentAnnouncementsPage';
import { ParentConsentsPage } from './modules/parent/pages/ParentConsentsPage';
import { ParentAccountPage } from './modules/parent/pages/ParentAccountPage';
import { ParentNotificationPreferencesPage } from './modules/parent/pages/ParentNotificationPreferencesPage';
import { ParentSecurityPage } from './modules/parent/pages/ParentSecurityPage';
import { ParentPrivacyPage } from './modules/parent/pages/ParentPrivacyPage';
import { ParentTeacherInfoPage } from './modules/parent/pages/ParentTeacherInfoPage';
import { AdminChatPage } from './modules/chat/pages/AdminChatPage';

// Role-based root redirect per Spec §4.3: Parent -> /parent, Staff -> /today, Admin -> /dashboard
function RoleBasedHomeRedirect() {
  const { isAdmin, isParent } = useAuth();
  if (isParent) {
    return <Navigate to="/parent" replace />;
  }
  return <Navigate to={isAdmin ? '/dashboard' : '/today'} replace />;
}

// Shell for mobile-first parent portal pages with child context and bottom tabs
function ParentRouteShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ParentChildProvider>
        <ParentLayout>{children}</ParentLayout>
      </ParentChildProvider>
    </ProtectedRoute>
  );
}

// Standalone shell for parent onboarding and security screens
function ParentStandaloneRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ParentChildProvider>{children}</ParentChildProvider>
    </ProtectedRoute>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppLayout>
            <Routes>
              {/* Public & Forced Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />

              {/* Role-Based Landing per Spec §4.3 */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <RoleBasedHomeRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Primary Daily Operations Routes */}
              <Route
                path="/today"
                element={
                  <ProtectedRoute>
                    <TodayBoardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Children Routes */}
              <Route
                path="/children"
                element={
                  <ProtectedRoute>
                    <ChildrenListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/children/new"
                element={
                  <ProtectedRoute>
                    <RegisterChildPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/children/:childId"
                element={
                  <ProtectedRoute>
                    <ChildDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/children/:childId/history"
                element={
                  <ProtectedRoute>
                    <ChildHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Guardians Routes */}
              <Route
                path="/guardians"
                element={
                  <ProtectedRoute>
                    <GuardiansListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/guardians/:guardianId"
                element={
                  <ProtectedRoute>
                    <GuardianDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Classrooms Routes */}
              <Route
                path="/classrooms"
                element={
                  <ProtectedRoute>
                    <ClassroomsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classrooms/:classroomId"
                element={
                  <ProtectedRoute>
                    <ClassroomDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Enrollment Routes */}
              <Route
                path="/enrollment"
                element={
                  <ProtectedRoute>
                    <EnrollmentListPage />
                  </ProtectedRoute>
                }
              />

              {/* Staff Routes (Admin only) */}
              <Route
                path="/staff"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <StaffListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff/:staffId"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <StaffDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Detailed Ledger & Audit Routes */}
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute>
                    <DailyAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance/child/:childId"
                element={
                  <ProtectedRoute>
                    <ChildAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/meals"
                element={
                  <ProtectedRoute>
                    <MealsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities"
                element={
                  <ProtectedRoute>
                    <DailyActivitiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/daily"
                element={
                  <ProtectedRoute>
                    <DailyReportsPage />
                  </ProtectedRoute>
                }
              />

              {/* Profile & Settings Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <AdminChatPage />
                  </ProtectedRoute>
                }
              />

              {/* ========================================================= */}
              {/* Parent Portal Routes (Spec §4.1)                           */}
              {/* ========================================================= */}
              <Route path="/parent/login" element={<Navigate to="/login" replace />} />
              <Route
                path="/parent/change-password"
                element={
                  <ParentStandaloneRoute>
                    <ParentChangePasswordPage />
                  </ParentStandaloneRoute>
                }
              />
              <Route
                path="/parent/welcome"
                element={
                  <ParentStandaloneRoute>
                    <ParentWelcomePage />
                  </ParentStandaloneRoute>
                }
              />

              <Route
                path="/parent"
                element={
                  <ParentRouteShell>
                    <ParentTodayPage />
                  </ParentRouteShell>
                }
              />
              <Route path="/parent/today" element={<Navigate to="/parent" replace />} />
              <Route
                path="/parent/children"
                element={
                  <ParentRouteShell>
                    <ParentChildrenListPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/children/:id"
                element={
                  <ParentRouteShell>
                    <ParentChildHubPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/children/:id/teacher"
                element={
                  <ParentRouteShell>
                    <ParentTeacherInfoPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/children/:id/profile"
                element={
                  <ParentRouteShell>
                    <ParentChildProfilePage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/children/:id/day"
                element={
                  <ParentRouteShell>
                    <ParentDailyStoryPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/children/:id/wellbeing"
                element={
                  <ParentRouteShell>
                    <ParentWellbeingPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/children/:id/photos"
                element={
                  <ParentRouteShell>
                    <ParentPhotosPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/children/:id/absence/new"
                element={
                  <ParentRouteShell>
                    <ParentAbsencePage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/children/:id/pickup/new"
                element={
                  <ParentRouteShell>
                    <ParentPickupPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/children/:id/home-note/new"
                element={
                  <ParentRouteShell>
                    <ParentHomeNotePage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/messages"
                element={
                  <ParentRouteShell>
                    <ParentMessagesPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/messages/new"
                element={
                  <ParentRouteShell>
                    <ParentNewMessagePage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/messages/:conversationId"
                element={
                  <ParentRouteShell>
                    <ParentChatThreadPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/complaints"
                element={
                  <ParentRouteShell>
                    <ParentComplaintsListPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/complaints/new"
                element={
                  <ParentRouteShell>
                    <ParentNewComplaintPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/complaints/:id"
                element={
                  <ParentRouteShell>
                    <ParentComplaintDetailPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/incidents/:id"
                element={
                  <ParentRouteShell>
                    <ParentIncidentDetailPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/notifications"
                element={
                  <ParentRouteShell>
                    <ParentNotificationsPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/announcements"
                element={
                  <ParentRouteShell>
                    <ParentAnnouncementsPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/consents"
                element={
                  <ParentRouteShell>
                    <ParentConsentsPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/account"
                element={
                  <ParentRouteShell>
                    <ParentAccountPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/account/notifications"
                element={
                  <ParentRouteShell>
                    <ParentNotificationPreferencesPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/account/security"
                element={
                  <ParentRouteShell>
                    <ParentSecurityPage />
                  </ParentRouteShell>
                }
              />
              <Route
                path="/parent/account/privacy"
                element={
                  <ParentRouteShell>
                    <ParentPrivacyPage />
                  </ParentRouteShell>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
  );
}

export default App;
