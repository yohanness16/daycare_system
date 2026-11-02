import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { useLanguage } from '../../../core/i18n/LanguageContext';
import { useParentChild } from '../context/ParentChildContext';
import { parentApi } from '../api/parentApi';
import type {
  ChildLiveStatus,
  ParentDailyReport,
  WellbeingOverview,
  ParentNotification,
  Announcement,
} from '../types/parent';
import { LiveStatusCard } from '../components/LiveStatusCard';
import { AttentionCard } from '../components/AttentionCard';
import { TimelineEntry } from '../components/TimelineEntry';
import { WellbeingGauge } from '../components/WellbeingGauge';
import { ParentGuideJourney } from '../components/ParentGuideJourney';
import { DashboardQuickMessage } from '../components/DashboardQuickMessage';
import { PickupPassModal } from '../components/PickupPassModal';

export const ParentTodayPage: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const { childrenList, activeChild, selectedChildId } = useParentChild();

  const [liveStatus, setLiveStatus] = useState<ChildLiveStatus | null>(null);
  const [dailyReport, setDailyReport] = useState<ParentDailyReport | null>(null);
  const [wellbeing, setWellbeing] = useState<WellbeingOverview | null>(null);
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPickupPassModal, setShowPickupPassModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeChild) return;
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [statusRes, reportRes, wbRes, notifRes, annRes] = await Promise.all([
        parentApi.getChildStatus(activeChild.childId),
        parentApi.getDailyReport(activeChild.childId, today),
        parentApi.getWellbeingOverview(activeChild.childId),
        parentApi.getNotifications(),
        parentApi.getAnnouncements(),
      ]);

      setLiveStatus(statusRes);
      setDailyReport(reportRes);
      setWellbeing(wbRes);
      setNotifications(notifRes);
      setAnnouncements(annRes);
    } catch (err) {
      console.error('Failed to load today dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeChild]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const getTimeGreeting = () => {
    const hours = new Date().getHours();
    if (language === 'am') {
      if (hours < 12) return 'እንደምን አደሩ';
      if (hours < 17) return 'እንደምን ዋሉ';
      return 'መልካም ምሽት';
    }
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayFormatted = new Date().toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const urgentAttentionItems = notifications.filter(
    (n) => (n.priority === 'Urgent' || n.type === 'INCIDENT_CREATED') && !n.isRead
  );

  const primaryTeacherName =
    activeChild?.primaryTeachers?.[0]?.name || (language === 'am' ? 'የክፍሉ አስተማሪ' : 'Classroom Teacher');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Greeting Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-[#E3DCCE] dark:border-slate-700 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3A7D5C] animate-pulse" />
            <span className="text-[11px] font-bold text-[#3A7D5C] dark:text-emerald-400 uppercase tracking-wider block">
              {todayFormatted} · {t('liveCareOverview', 'Live Care Overview')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
            {getTimeGreeting()}, {user?.firstName || (language === 'am' ? 'ወላጅ' : 'Parent')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'am'
              ? 'እንኳን ወደ ልጅዎ የዕለት እንክብካቤ እና ሰላም መከታተያ ገጽ በደህና መጡ'
              : "Welcome to your child's daily peace-of-mind dashboard"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Digital Pickup Pass Action */}
          <button
            type="button"
            onClick={() => setShowPickupPassModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#E06A3B]/10 hover:bg-[#E06A3B]/20 text-[#E06A3B] border border-[#E06A3B]/20 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
            title={t('pickupPassSubtitle', 'Open Digital Pickup Pass PIN & QR code')}
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            <span>{t('pickupPass', 'Pickup Pass')}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-[#FDFBF7] dark:bg-slate-800 hover:bg-[#F0ECE1] border border-[#E3DCCE] dark:border-slate-700 transition-all active:scale-[0.98] cursor-pointer"
            title={t('refresh', 'Refresh Live Status')}
          >
            <span className={`material-symbols-outlined text-[20px] ${isRefreshing ? 'animate-spin text-[#E06A3B]' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton Indicator */}
      {isLoading && !liveStatus && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-[#E3DCCE] dark:border-slate-700 shadow-xs flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-3xl text-[#E06A3B] animate-spin">
            progress_activity
          </span>
          <p className="text-xs font-semibold text-slate-500">
            {language === 'am' ? 'የልጅዎ የዕለት መረጃ በመጫን ላይ ነው...' : "Checking in with your child's teachers..."}
          </p>
        </div>
      )}

      {/* 2. Needs Your Attention Stack (Urgent notifications / Incidents) */}
      {urgentAttentionItems.length > 0 && (
        <div className="space-y-3">
          {urgentAttentionItems.map((item) => (
            <AttentionCard
              key={item.id}
              severity="Urgent"
              title={item.title}
              description={item.body}
              actionLabel={language === 'am' ? 'እይ እና አረጋግጥ' : 'Review & Acknowledge'}
              actionUrl={item.actionUrl || '/parent/notifications'}
            />
          ))}
        </div>
      )}

      {/* 3. Live Status Hero Card */}
      {activeChild ? (
        selectedChildId === 'all' && childrenList.length > 1 ? (
          /* Multi-child "All" stacked view */
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {language === 'am' ? 'ሁሉም ልጆች ዛሬ' : 'All Children Today'}
            </h3>
            {childrenList.map((kid) => (
              <LiveStatusCard
                key={kid.childId}
                child={kid}
                liveStatus={kid.childId === activeChild.childId ? liveStatus : null}
                onRefresh={loadData}
              />
            ))}
          </div>
        ) : (
          /* Single Hero Status Card */
          <LiveStatusCard
            child={activeChild}
            liveStatus={liveStatus}
            onRefresh={loadData}
          />
        )
      ) : (
        <div className="p-8 text-center bg-white dark:bg-slate-800/90 rounded-3xl border border-[#E3DCCE] dark:border-slate-700">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">child_care</span>
          <p className="text-sm text-slate-500 font-medium">
            {language === 'am' ? 'ከዚህ መለያ ጋር የተገናኘ ልጅ አልተገኘም።' : 'No child records linked to this account.'}
          </p>
        </div>
      )}

      {/* 4. Parent Guide: Daily Routine Journey */}
      {activeChild && (
        <ParentGuideJourney
          childId={activeChild.childId}
          childName={activeChild.firstName}
          classroomName={activeChild.classroom?.name || (language === 'am' ? 'የፀሐይ ክፍል' : 'Sunshine Room')}
          attendanceStatus={liveStatus?.attendance?.status || activeChild.today.status}
          liveStatus={liveStatus}
        />
      )}

      {/* 5. Working Easy-UX Classroom Messaging Card */}
      {activeChild && (
        <DashboardQuickMessage
          childId={activeChild.childId}
          childName={activeChild.firstName}
          classroomName={activeChild.classroom?.name || (language === 'am' ? 'የፀሐይ ክፍል' : 'Sunshine Room')}
          teacherName={primaryTeacherName}
        />
      )}

      {/* 6. Quick Actions Grid */}
      {activeChild && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {t('quickActions', 'Essential Quick Actions')}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {language === 'am' ? 'በቀላሉ 1-ጠቅታ አቋራጮች' : 'Touch-friendly 1-tap shortcuts'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {/* Report Absence */}
            <Link
              to={`/parent/children/${activeChild.childId}/absence/new`}
              className="p-4 rounded-3xl bg-white dark:bg-slate-800/90 border border-[#E3DCCE] dark:border-slate-700 hover:border-[#E06A3B] dark:hover:border-[#E06A3B] hover:shadow-xs active:scale-[0.98] transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]">event_busy</span>
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {t('absenceNotice', 'Report Absence')}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {language === 'am' ? 'የህመም ወይም የጉዞ ፈቃድ' : 'Sick day or family trip'}
              </span>
            </Link>

            {/* Morning Note */}
            <Link
              to={`/parent/children/${activeChild.childId}/home-note/new`}
              className="p-4 rounded-3xl bg-white dark:bg-slate-800/90 border border-[#E3DCCE] dark:border-slate-700 hover:border-[#E06A3B] dark:hover:border-[#E06A3B] hover:shadow-xs active:scale-[0.98] transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]">note_add</span>
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {t('homeNote', 'Morning Note')}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {language === 'am' ? 'የእንቅልፍ ወይም የጥርስ ማስታወሻ' : 'Teething or sleep note'}
              </span>
            </Link>

            {/* Pickup Change */}
            <Link
              to={`/parent/children/${activeChild.childId}/pickup/new`}
              className="p-4 rounded-3xl bg-white dark:bg-slate-800/90 border border-[#E3DCCE] dark:border-slate-700 hover:border-[#3A7D5C] dark:hover:border-[#3A7D5C] hover:shadow-xs active:scale-[0.98] transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#3A7D5C]/10 text-[#3A7D5C] dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]">directions_car</span>
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {language === 'am' ? 'ተረካቢ ቀይር' : 'Pickup Change'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {language === 'am' ? 'ሌላ ሰው ፍቀድ' : 'Authorize person today'}
              </span>
            </Link>

            {/* Pickup Pass Modal */}
            <button
              type="button"
              onClick={() => setShowPickupPassModal(true)}
              className="p-4 rounded-3xl bg-white dark:bg-slate-800/90 border border-[#E3DCCE] dark:border-slate-700 hover:border-[#E06A3B] dark:hover:border-[#E06A3B] hover:shadow-xs active:scale-[0.98] transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#E06A3B]/10 text-[#E06A3B] dark:text-orange-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {t('pickupPass', 'Pickup Pass')}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {language === 'am' ? 'QR ኮድ እና PIN ቁጥር' : 'Kiosk QR & security PIN'}
              </span>
            </button>

            {/* Call Center */}
            <a
              href="tel:+15552345678"
              className="p-4 rounded-3xl bg-white dark:bg-slate-800/90 border border-[#E3DCCE] dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-xs active:scale-[0.98] transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]">call</span>
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {t('callCenter', 'Call Center')}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {language === 'am' ? 'የአደጋ ጊዜ ፈጣን ስልክ' : 'Emergency direct desk'}
              </span>
            </a>
          </div>
        </div>
      )}

      {/* 7. Latest from the Team / Timeline Highlights */}
      {dailyReport && dailyReport.timeline && dailyReport.timeline.length > 0 && (
        <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 sm:p-6 border border-[#E3DCCE] dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F0ECE1] dark:border-slate-700/80">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight">
                {language === 'am' ? 'የዛሬ አዳዲስ እንቅስቃሴዎች' : 'Latest Moments from Today'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'am' ? 'የትምህርት፣ የምግብ እና የጨዋታ ጊዜያት' : 'Chronological learning and play entries'}
              </p>
            </div>
            {activeChild && (
              <Link
                to={`/parent/children/${activeChild.childId}/day`}
                className="text-xs font-bold text-[#E06A3B] hover:text-[#D9531E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'am' ? 'ሙሉ ታሪክ እይ' : 'Full Story Feed'}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            )}
          </div>

          <div className="space-y-1">
            {dailyReport.timeline.slice(-3).reverse().map((entry, idx) => (
              <TimelineEntry key={idx} item={entry} />
            ))}
          </div>
        </div>
      )}

      {/* 8. Photo Moments Strip */}
      {dailyReport && dailyReport.photos && dailyReport.photos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {t('dailyPhotosFeed', "Today's Learning Photos")}
            </h3>
            {activeChild && (
              <Link
                to={`/parent/children/${activeChild.childId}/photos`}
                className="text-xs font-bold text-[#E06A3B] hover:text-[#D9531E] hover:underline cursor-pointer"
              >
                {language === 'am' ? `ሙሉ አልበም (${dailyReport.photos.length}) →` : `Full Gallery (${dailyReport.photos.length}) →`}
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
            {dailyReport.photos.map((photo) => (
              <div
                key={photo.id}
                className="w-44 sm:w-52 h-36 rounded-2xl overflow-hidden shrink-0 border border-[#E3DCCE] dark:border-slate-700 relative group shadow-2xs"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Shared activity moment'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent text-white text-[11px] font-medium truncate">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. Well-Being Snapshot & Score */}
      {wellbeing && activeChild && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              {t('wellbeingOverview', 'Mood & Wellbeing')}
            </h3>
            <Link
              to={`/parent/children/${activeChild.childId}/wellbeing`}
              className="text-xs font-bold text-[#E06A3B] hover:text-[#D9531E] hover:underline cursor-pointer"
            >
              {language === 'am' ? 'ዝርዝር እይ →' : 'Detailed Trends →'}
            </Link>
          </div>
          <WellbeingGauge
            score={wellbeing.score.value}
            label={wellbeing.score.label}
            explanation={wellbeing.score.explanation}
            disclaimer={wellbeing.disclaimer}
          />
        </div>
      )}

      {/* 10. Center Announcements Banner */}
      {announcements.length > 0 && (
        <div className="bg-gradient-to-r from-[#FDFBF7] to-[#F7F4EC] dark:from-slate-800 dark:to-slate-800/80 rounded-3xl p-5 border border-[#E3DCCE] dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E06A3B] text-white flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">campaign</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E06A3B]">
                {t('announcements', 'Daycare Announcement')}
              </span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                {announcements[0].title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                {announcements[0].body}
              </p>
            </div>
          </div>

          <Link
            to="/parent/announcements"
            className="px-4 py-2 bg-[#E06A3B] hover:bg-[#D9531E] active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all shrink-0 cursor-pointer"
          >
            {language === 'am' ? 'ማስታወቂያውን አንብብ' : 'Read Notice'}
          </Link>
        </div>
      )}

      {/* 11. Digital Pickup Pass Modal */}
      {activeChild && (
        <PickupPassModal
          childName={activeChild.firstName}
          classroomName={activeChild.classroom?.name || (language === 'am' ? 'የፀሐይ ክፍል' : 'Sunshine Room')}
          isOpen={showPickupPassModal}
          onClose={() => setShowPickupPassModal(false)}
        />
      )}
    </div>
  );
};
