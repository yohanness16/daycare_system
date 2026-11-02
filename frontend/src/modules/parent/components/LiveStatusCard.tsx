import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../core/i18n/LanguageContext';
import type { ParentChildCard, ChildLiveStatus } from '../types/parent';
import { ChildAvatar } from './ChildAvatar';
import { StatusBadge } from './StatusBadge';
import { MoodBadge } from './MoodBadge';

interface LiveStatusCardProps {
  child: ParentChildCard;
  liveStatus?: ChildLiveStatus | null;
  onRefresh?: () => void;
  className?: string;
}

export const LiveStatusCard: React.FC<LiveStatusCardProps> = ({
  child,
  liveStatus,
  onRefresh,
  className = '',
}) => {
  const { language, t } = useLanguage();
  const currentAttendance = liveStatus?.attendance?.status || child.today.status;
  const currentActivity = liveStatus?.currentActivity || child.today.currentActivity;
  const isNapping = currentActivity?.description.toLowerCase().includes('nap');

  const getStatusNarrative = () => {
    if (language === 'am') {
      switch (currentAttendance) {
        case 'Present':
          return `በ${child.today.arrivalTime || '2:15 ጠዋት'} ደርሷል · ከአስተማሪዎች ጋር በክፍል ውስጥ ይገኛል`;
        case 'CheckedOut':
          return `በ${child.today.departureTime || '11:00 ከሰዓት'} ተረክበዋል · መልካም ምሽት!`;
        case 'Late':
          return `ዘግይቶ ደርሷል (${child.today.arrivalTime || '2:45'}) · በክፍል ውስጥ ይገኛል`;
        case 'Sick':
          return 'በህመም ምክንያት ዛሬ እቤት እረፍት ላይ ነው · ቶሎ ይማረው!';
        case 'Absent':
        case 'ExcusedAbsence':
          return 'ለዛሬ የተፈቀደ ቀሪ ማስታወቂያ አለ';
        case 'CenterClosed':
          return 'ማቆያው ለዛሬ ዝግ ነው';
        case 'NotArrived':
        default:
          return 'እስካሁን አልደረሰም · በ3:00 ይጠበቃል';
      }
    }

    switch (currentAttendance) {
      case 'Present':
        return `Arrived at ${child.today.arrivalTime || '8:15 AM'} · with ${
          child.primaryTeachers[0]?.name || 'the classroom team'
        }`;
      case 'CheckedOut':
        return `Picked up at ${child.today.departureTime || '5:00 PM'} · Have a wonderful evening!`;
      case 'Late':
        return `Arrived late at ${child.today.arrivalTime} · Settled in class`;
      case 'Sick':
        return 'Resting at home today due to illness · Get well soon!';
      case 'Absent':
      case 'ExcusedAbsence':
        return 'Excused absence for today';
      case 'CenterClosed':
        return 'Daycare is closed today for holiday/staff work';
      case 'NotArrived':
      default:
        return 'Not arrived yet today · Expected by 9:00 AM';
    }
  };

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-white to-[#FDFBF7] dark:from-slate-800 dark:to-slate-900 border border-[#E3DCCE] dark:border-slate-700 shadow-sm transition-all duration-300 ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <ChildAvatar
            firstName={child.firstName}
            lastName={child.lastName}
            photoUrl={child.photoUrl}
            status={currentAttendance}
            size="lg"
            pulse={isNapping}
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {child.firstName}
              </h2>
              <StatusBadge status={currentAttendance} />
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {child.classroom.name}
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('refresh', 'Refresh Status')}
          >
            <span className="material-symbols-outlined text-[20px]">sync</span>
          </button>
        )}
      </div>

      {/* Main Status Narrative */}
      <div className="mt-4 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 flex items-center gap-2.5">
        <span className="material-symbols-outlined text-primary-500 text-[20px] shrink-0">
          {currentAttendance === 'Present'
            ? 'wb_sunny'
            : currentAttendance === 'CheckedOut'
            ? 'cottage'
            : 'schedule'}
        </span>
        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
          {getStatusNarrative()}
        </span>
      </div>

      {/* Current Activity Strip (if Present) */}
      {currentAttendance === 'Present' && currentActivity && (
        <div className="mt-3 p-3.5 rounded-2xl bg-primary-50/70 dark:bg-primary-950/40 border border-primary-200/60 dark:border-primary-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isNapping
                  ? 'bg-indigo-500 text-white animate-pulse'
                  : 'bg-primary-500 text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isNapping ? 'bedtime' : 'toys'}
              </span>
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary-700 dark:text-primary-300 block">
                {language === 'am' ? 'በአሁኑ ሰዓት' : 'Right Now'}
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {currentActivity.description}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 shrink-0">
            {language === 'am' ? 'በሂደት ላይ' : 'In progress'}
          </span>
        </div>
      )}

      {/* Today Mini-Stats Row (4 chips) */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-[#E3DCCE]/80 dark:border-slate-700 flex items-center gap-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">restaurant</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('meals', 'Meals')}
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block">
              {liveStatus?.today?.meals?.count ?? 2} {language === 'am' ? 'ተመዝግቧል' : 'logged'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-[#E3DCCE]/80 dark:border-slate-700 flex items-center gap-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">bedtime</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('napTime', 'Nap Time')}
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block">
              {liveStatus?.today?.naps?.totalMinutes
                ? `${liveStatus.today.naps.totalMinutes} ${language === 'am' ? 'ደቂቃ' : 'm'}`
                : (language === 'am' ? '45 ደቂቃ' : '45 min')}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-[#E3DCCE]/80 dark:border-slate-700 flex items-center gap-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-[#3A7D5C]/10 text-[#3A7D5C] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">palette</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('activities', 'Activities')}
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block">
              {liveStatus?.today?.activities?.count ?? 3} {language === 'am' ? 'ተጠናቋል' : 'completed'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-[#E3DCCE]/80 dark:border-slate-700 flex items-center gap-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-[#E06A3B]/10 text-[#E06A3B] dark:text-orange-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">sentiment_satisfied</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('wellbeingOverview', 'Mood')}
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block">
              <MoodBadge mood={liveStatus?.mood?.current ?? child.today.mood} size="sm" />
            </span>
          </div>
        </div>
      </div>

      {/* Button Row */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
        <Link
          to={`/parent/messages?childId=${child.childId}`}
          className="flex-1 py-2.5 px-3 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold rounded-2xl text-center shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">chat</span>
          <span>{t('messageTeacher', 'Message Educator')}</span>
        </Link>

        <Link
          to={`/parent/children/${child.childId}/day`}
          className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-2xl text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">menu_book</span>
          <span>{t('dailyJournal', "Today's Story")}</span>
        </Link>
      </div>
    </div>
  );
};
