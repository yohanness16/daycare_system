import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../core/i18n/LanguageContext';
import { ActivityType } from '../../../core/types/enums';
import { useChildren } from '../../children/useChildren';
import { useDailyActivities } from '../useDailyActivities';

export const DailyActivitiesPage: React.FC = () => {
  const { t } = useLanguage();
  const [filterChildId, setFilterChildId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { activities, totalCount, recordActivity, deleteActivity } = useDailyActivities(filterChildId);
  const { children } = useChildren();

  const [childId, setChildId] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>(ActivityType.Learning);
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);

  // Compute reactive duration string
  const computedDuration = useMemo(() => {
    if (!startTime || !endTime) return null;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const diff = endMins - startMins;
    if (diff <= 0) return 'End time must be after start time';
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0 && mins > 0) return `${hours} hr ${mins} mins`;
    if (hours > 0) return `${hours} hr`;
    return `${mins} mins`;
  }, [startTime, endTime]);

  const calculateDuration = (start?: string, end?: string | null) => {
    if (!start || !end) return null;
    try {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      const diffMinutes = Math.round((e - s) / 60000);
      if (diffMinutes <= 0) return null;
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h`;
      return `${minutes}m`;
    } catch {
      return null;
    }
  };

  const formatTime = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  const filteredActivities = activities.filter((a) => {
    const matchesSearch =
      a.activityDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.childName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.note && a.note.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'Learning' && a.activityType !== ActivityType.Learning) return false;
    if (selectedCategory === 'Nap' && a.activityType !== ActivityType.Nap) return false;
    if (selectedCategory === 'Outdoor' && a.activityType !== ActivityType.Outdoor) return false;
    if (selectedCategory === 'Health' && a.activityType !== ActivityType.Ill) return false;
    if (selectedCategory === 'Meal' && a.activityType !== ActivityType.Eating) return false;

    return true;
  });

  const handleLog = (e: React.FormEvent) => {
    e.preventDefault();
    const targetChildId = childId || children[0]?.id;
    if (!targetChildId || !description.trim()) return;

    const child = children.find((c) => c.id === targetChildId);

    const startIso = new Date(`${activityDate}T${startTime}:00`).toISOString();
    const endIso = endTime ? new Date(`${activityDate}T${endTime}:00`).toISOString() : null;

    recordActivity(
      {
        childId: targetChildId,
        activityType,
        startTime: startIso,
        endTime: endIso,
        activityDescription: description.trim(),
        note: note.trim(),
      },
      child ? `${child.firstName} ${child.lastName}` : 'Child',
      'Staff'
    );

    setDescription('');
    setNote('');
    setShowLogModal(false);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">
            {t('activities', 'Activities')}
          </h1>
          <p className="text-xs text-outline mt-0.5">
            Showing {activities.length} of {totalCount} activity logs
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>{t('logActivity', 'Log Activity')}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-xl border border-surface-container-low shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: 'All', value: 'All' },
            { label: 'Learning', value: 'Learning' },
            { label: 'Nap', value: 'Nap' },
            { label: 'Outdoor', value: 'Outdoor' },
            { label: 'Health', value: 'Health' },
            { label: 'Meal', value: 'Meal' },
          ].map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Child Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={filterChildId}
            onChange={(e) => setFilterChildId(e.target.value)}
            className="h-8 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
          >
            <option value="">All Children</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </select>

          <div className="relative w-44">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-outline text-[16px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-7 pr-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
            />
          </div>
        </div>
      </div>

      {/* Activities Table View */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-low overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-container-low text-outline uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-3">Child</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Time Frame &amp; Duration</th>
                <th className="py-2.5 px-3">Staff</th>
                <th className="py-2.5 px-3">Notes</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-outline text-xs">
                    No activities recorded under this filter.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-on-surface">
                      <Link to={`/children/${a.childId}`} className="text-on-surface hover:text-primary no-underline">
                        {a.childName}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-semibold text-[11px]">
                        {a.activityType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-on-surface font-medium max-w-sm truncate" title={a.activityDescription}>
                      {a.activityDescription}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-on-surface text-xs font-medium">
                        {formatTime(a.startTime)} {a.endTime ? `→ ${formatTime(a.endTime)}` : '(Started)'}
                      </div>
                      {calculateDuration(a.startTime, a.endTime) && (
                        <div className="text-[11px] text-primary font-semibold">
                          {calculateDuration(a.startTime, a.endTime)}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-on-surface-variant">
                      {a.recordedByName || 'Staff'}
                    </td>
                    <td className="py-2.5 px-3 text-outline max-w-xs truncate" title={a.note}>
                      {a.note || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteActivity(a.id)}
                        className="text-outline hover:text-error text-xs cursor-pointer"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Activity Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-5 shadow-xl border border-surface-container flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
              <h2 className="text-base font-bold text-on-surface">Log Activity</h2>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleLog} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Child <span className="text-red-500">*</span>
                </label>
                <select
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                  required
                >
                  <option value="">-- Select Child --</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Activity Type
                </label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as ActivityType)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                >
                  <option value={ActivityType.Learning}>Learning</option>
                  <option value={ActivityType.Play}>Play</option>
                  <option value={ActivityType.Nap}>Nap / Rest</option>
                  <option value={ActivityType.Outdoor}>Outdoor</option>
                  <option value={ActivityType.Art}>Art</option>
                  <option value={ActivityType.Music}>Music</option>
                  <option value={ActivityType.Ill}>Health / Incident</option>
                  <option value={ActivityType.Eating}>Meal / Snack</option>
                </select>
              </div>

              {/* Time Range Inputs */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full h-9 px-2 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container font-mono"
                  />
                </div>
              </div>

              {/* Reactive Duration Display */}
              {computedDuration && (
                <div className="p-2 rounded-lg bg-surface-container-low border border-surface-container text-xs flex items-center justify-between text-on-surface-variant">
                  <span className="flex items-center gap-1.5 font-medium text-[11px]">
                    <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                    <span>Session Duration:</span>
                  </span>
                  <span className="font-bold text-primary font-mono text-[11px]">{computedDuration}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Activity Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block building and counting exercise"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Participated actively, very engaged"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container-low">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-xs text-on-primary font-semibold cursor-pointer"
                >
                  Save Activity Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
