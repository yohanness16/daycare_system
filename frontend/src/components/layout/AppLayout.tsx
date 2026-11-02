import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';
import { useLanguage } from '../../core/i18n/LanguageContext';
import { useTheme } from '../../core/theme/ThemeContext';
import { Avatar } from '../ui/Avatar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { isDark: isDarkMode, toggleTheme: toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMoreSheetOpen, setMobileMoreSheetOpen] = useState(false);

  // If on login page or change password or parent portal or not authenticated, render without staff shell layout
  if (
    !isAuthenticated ||
    location.pathname === '/login' ||
    location.pathname === '/change-password' ||
    location.pathname.startsWith('/parent')
  ) {
    return <>{children}</>;
  }

  const currentDateFormatted = new Date().toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/today')) return 'Today Board';
    if (path === '/dashboard') return t('dashboard', 'Dashboard');
    if (path.startsWith('/children/new')) return t('enrollment', 'Register Child');
    if (path.includes('/history')) return t('childHistoryTitle', 'Child History');
    if (path.startsWith('/children')) return t('children', 'Children');
    if (path.startsWith('/guardians')) return t('guardians', 'Guardians');
    if (path.startsWith('/enrollment')) return t('enrollment', 'Enrollment');
    if (path.startsWith('/attendance')) return t('attendance', 'Attendance');
    if (path.startsWith('/meals')) return t('meals', 'Meals');
    if (path.startsWith('/activities')) return t('activities', 'Daily Activities');
    if (path.startsWith('/classrooms')) return t('classrooms', 'Classrooms');
    if (path.startsWith('/staff')) return t('staff', 'Staff');
    if (path.startsWith('/reports')) return 'Daily Reports';
    if (path.startsWith('/profile')) return 'My Profile';
    if (path.startsWith('/messages')) return 'Messages & Chat';
    if (path.startsWith('/settings')) return t('settings', 'Settings');
    return t('dashboard', 'Dashboard');
  };

  // Navigation Items per Spec §4.1 & §4.2
  const navSections = [
    {
      heading: 'Operations',
      links: [
        { to: '/today', label: 'Today Board', icon: 'wb_sunny', badge: 'Primary' },
        { to: '/dashboard', label: t('dashboard', 'Dashboard'), icon: 'dashboard' },
        { to: '/messages', label: 'Messages & Chat', icon: 'chat' },
      ],
    },
    {
      heading: t('studentsAndFamilies', 'Students & Families'),
      links: [
        { to: '/children', label: t('children', 'Children'), icon: 'child_care' },
        { to: '/guardians', label: t('guardians', 'Guardians'), icon: 'family_restroom' },
        { to: '/enrollment', label: t('enrollment', 'Enrollment'), icon: 'assignment' },
      ],
    },
    {
      heading: t('dailyOperations', 'Logs & Reports'),
      links: [
        { to: '/attendance', label: t('attendance', 'Attendance Audit'), icon: 'fact_check' },
        { to: '/meals', label: t('meals', 'Meals & Food'), icon: 'restaurant' },
        { to: '/activities', label: t('activities', 'Activities'), icon: 'event_note' },
        { to: '/reports/daily', label: 'Daily Reports', icon: 'bar_chart' },
      ],
    },
    {
      heading: t('facility', 'Facility & Team'),
      links: [
        { to: '/classrooms', label: t('classrooms', 'Classrooms'), icon: 'meeting_room' },
        ...(isAdmin ? [{ to: '/staff', label: t('staff', 'Staff'), icon: 'badge' }] : []),
      ],
    },
    ...(isAdmin
      ? [
          {
            heading: t('system', 'System'),
            links: [
              { to: '/settings', label: t('settings', 'Settings'), icon: 'settings' },
            ],
          },
        ]
      : []),
  ];

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 font-body-md text-slate-800 dark:text-slate-100 antialiased min-h-screen pb-16 sm:pb-0">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-2xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop / Tablet Sidebar Navigation per Spec §4.2 */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm z-50 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div
            className={`h-16 flex items-center border-b border-slate-100 dark:border-slate-800 transition-all duration-300 ${
              isCollapsed ? 'px-3 justify-center' : 'px-5 justify-between'
            }`}
          >
            <Link
              to={isAdmin ? '/dashboard' : '/today'}
              className="flex items-center gap-3 no-underline overflow-hidden"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[22px]">child_care</span>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-[15px] text-slate-900 dark:text-white tracking-tight leading-tight">
                    DAYCARE OS
                  </span>
                  <span className="text-[10px] text-primary-500 tracking-wider uppercase font-bold">
                    Floor &amp; Desk
                  </span>
                </div>
              )}
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="overflow-y-auto flex-1 px-3 py-4 space-y-5">
            {navSections.map((section) => (
              <div key={section.heading} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 text-[10px] text-slate-400 dark:text-slate-500 tracking-wider uppercase font-extrabold mb-1.5">
                    {section.heading}
                  </div>
                )}
                {isCollapsed && (
                  <div className="w-8 h-px bg-slate-100 dark:bg-slate-800 mx-auto my-2" />
                )}
                {section.links.map((link) => {
                  const isActive =
                    location.pathname === link.to ||
                    (link.to !== '/dashboard' && link.to !== '/today' && location.pathname.startsWith(link.to));

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      title={link.label}
                      className={`flex items-center gap-3 rounded-xl font-medium text-xs sm:text-sm transition-all ${
                        isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-primary-500 text-white font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600 dark:hover:text-primary-400'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {link.icon}
                      </span>
                      {!isCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>{link.label}</span>
                          {'badge' in link && (
                            <span
                              className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold tracking-wider ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300'
                              }`}
                            >
                              {link.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer Collapse Toggle */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex w-full items-center justify-center gap-2 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs font-semibold"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isCollapsed ? 'chevron_right' : 'chevron_left'}
              </span>
              {!isCollapsed && <span>Collapse Sidebar</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <header
          className={`fixed top-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs z-40 flex items-center justify-between px-4 sm:px-6 transition-all duration-300 ease-in-out ${
            isCollapsed ? 'lg:left-20' : 'lg:left-64'
          } left-0`}
        >
          {/* Left Title & Collapse Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isCollapsed ? 'menu' : 'menu_open'}
              </span>
            </button>

            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Controls: Theme Toggle, Language, Date, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button per Spec §5.1 */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Language Selector */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-xs ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('am')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-xs ${
                  language === 'am'
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="ወደ አማርኛ ቀይር"
              >
                አማ
              </button>
            </div>

            {/* Date Display */}
            <div className="hidden sm:flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-[16px] text-primary-500">
                calendar_today
              </span>
              <span>{currentDateFormatted}</span>
            </div>

            {/* Profile Avatar & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary-500/20 transition-all cursor-pointer"
                title={`${user?.firstName} ${user?.lastName}`}
              >
                <Avatar
                  name={`${user?.firstName} ${user?.lastName}`}
                  id={user?.id}
                  size="sm"
                />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {user?.role || (isAdmin ? 'Administrator' : 'Educator')}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 no-underline transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-slate-400">
                      account_circle
                    </span>
                    <span>My Profile</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 no-underline transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-slate-400">
                        settings
                      </span>
                      <span>{t('settings', 'Settings')}</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors w-full text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>{t('signOut', 'Sign Out')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 mt-16 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Phone Bottom Navigation Bar (< 640px) per Spec §4.2 */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 flex items-center justify-around px-2 no-print">
        <Link
          to="/today"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 no-underline ${
            location.pathname.startsWith('/today')
              ? 'text-primary-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">wb_sunny</span>
          <span className="text-[10px]">Today</span>
        </Link>

        <Link
          to="/children"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 no-underline ${
            location.pathname.startsWith('/children')
              ? 'text-primary-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">child_care</span>
          <span className="text-[10px]">Children</span>
        </Link>

        <Link
          to="/classrooms"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 no-underline ${
            location.pathname.startsWith('/classrooms')
              ? 'text-primary-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">meeting_room</span>
          <span className="text-[10px]">Rooms</span>
        </Link>

        <Link
          to="/reports/daily"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 no-underline ${
            location.pathname.startsWith('/reports')
              ? 'text-primary-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">bar_chart</span>
          <span className="text-[10px]">Reports</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMoreSheetOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 cursor-pointer ${
            mobileMoreSheetOpen ? 'text-primary-600 font-bold' : 'text-slate-400'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">more_horiz</span>
          <span className="text-[10px]">More</span>
        </button>
      </nav>

      {/* Mobile "More" Slide-up Sheet */}
      {mobileMoreSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-2xs"
            onClick={() => setMobileMoreSheetOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl p-5 border-t border-slate-200 dark:border-slate-800 z-10 space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Facility &amp; Team
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/guardians"
                onClick={() => setMobileMoreSheetOpen(false)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200 no-underline"
              >
                <span className="material-symbols-outlined text-[20px] text-primary-500">
                  family_restroom
                </span>
                <span>Guardians</span>
              </Link>

              <Link
                to="/enrollment"
                onClick={() => setMobileMoreSheetOpen(false)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200 no-underline"
              >
                <span className="material-symbols-outlined text-[20px] text-primary-500">
                  assignment
                </span>
                <span>Enrollment</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/staff"
                  onClick={() => setMobileMoreSheetOpen(false)}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200 no-underline"
                >
                  <span className="material-symbols-outlined text-[20px] text-primary-500">badge</span>
                  <span>Staff</span>
                </Link>
              )}

              <Link
                to="/profile"
                onClick={() => setMobileMoreSheetOpen(false)}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200 no-underline"
              >
                <span className="material-symbols-outlined text-[20px] text-primary-500">
                  account_circle
                </span>
                <span>My Profile</span>
              </Link>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMoreSheetOpen(false);
                  handleSignOut();
                }}
                className="w-full p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-bold flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
