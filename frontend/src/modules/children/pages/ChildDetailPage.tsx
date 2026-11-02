import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { useLanguage } from '../../../core/i18n/LanguageContext';
import { activityTypeToString, mealStatusToString, mealTypeToString } from '../../../core/types/enums';
import { childrenApi } from '../childrenApi';
import type { ChildDailyHistoryResponse } from '../types';
import { useChildren } from '../useChildren';
import { AllergyBadge, PhotoUploadAvatar } from '../../../components/ui';
import { incidentsApi } from '../../incidents/incidentsApi';
import { LogIncidentModal } from '../../incidents/components/LogIncidentModal';
import type { IncidentReport } from '../../incidents/types';

export const ChildDetailPage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const { getChildById, deleteChild, updatePhoto } = useChildren();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyHistory, setDailyHistory] = useState<ChildDailyHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  useEffect(() => {
    if (!childId) return;
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        setHistoryError(null);
        const res = await childrenApi.getDailyHistory(childId, historyDate);
        if (isMounted) setDailyHistory(res);
      } catch (err) {
        if (isMounted) {
          setHistoryError(err instanceof Error ? err.message : 'Failed to fetch daily history');
        }
      } finally {
        if (isMounted) setHistoryLoading(false);
      }
    };
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [childId, historyDate]);

  useEffect(() => {
    if (!childId) return;
    let isMounted = true;
    const loadIncidents = async () => {
      try {
        setIncidentsLoading(true);
        const list = await incidentsApi.getByChild(childId);
        if (isMounted) setIncidents(list);
      } catch {
        // ignore
      } finally {
        if (isMounted) setIncidentsLoading(false);
      }
    };
    loadIncidents();
    return () => {
      isMounted = false;
    };
  }, [childId]);

  if (!childId) {
    return <Navigate to="/children" replace />;
  }

  const child = getChildById(childId);
  if (!child) {
    return <Navigate to="/children" replace />;
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/children')}
              className="text-outline hover:text-primary text-xs font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Children</span>
            </button>
            <span className="text-outline-variant">/</span>
            <span className="text-xs text-primary font-semibold uppercase tracking-wider">
              Student Record
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">
              {child.firstName} {child.lastName}
            </h1>
            <AllergyBadge
              allergies={child.allergies}
              childName={`${child.firstName} ${child.lastName}`}
              size="md"
              dietaryRestrictions={child.dietaryRestrictions}
              medicalNotes={child.medicalNotes}
              medications={child.medications}
              bloodType={child.bloodType}
              pediatricianName={child.pediatricianName}
              pediatricianPhone={child.pediatricianPhone}
            />
          </div>
          <p className="text-xs text-outline font-mono">
            ID: {child.id}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/children/${child.id}/history`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold shadow-xs no-underline transition-colors border border-surface-container"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">history</span>
            <span>Care History</span>
          </Link>
          <Link
            to={`/attendance/child/${child.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs no-underline transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">fact_check</span>
            <span>{t('attendance', 'Attendance Log')}</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowIncidentModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 text-xs font-semibold shadow-xs transition-colors border border-rose-200 dark:border-rose-900 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">medical_services</span>
            <span>Log Care Notice</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Permanently delete ${child.firstName} ${child.lastName}?`)) {
                  deleteChild(child.id);
                  navigate('/children', { replace: true });
                }
              }}
              className="px-3.5 py-2 rounded-lg bg-error-container/40 text-on-error-container hover:bg-error-container text-xs font-semibold transition-colors cursor-pointer"
            >
              {t('delete', 'Delete Record')}
            </button>
          )}
        </div>
      </div>

      {/* Prominent Red Shield Allergy Warning Banner (FRONTEND_RULES.md §5.1) */}
      {child.allergies && child.allergies.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs ring-4 ring-red-100 dark:ring-red-900/40">
              <span className="material-symbols-outlined text-[26px]">shield_with_heart</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-red-900 dark:text-red-200">
                  Critical Emergency Allergy Warning
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
                  {child.allergies.length} Documented {child.allergies.length === 1 ? 'Allergy' : 'Allergies'}
                </span>
              </div>
              <p className="text-xs text-red-800 dark:text-red-300 font-bold mt-0.5">
                {child.allergies
                  .map((a) => (typeof a === 'string' ? a : a.allergen))
                  .join(' • ')}
              </p>
            </div>
          </div>

          <AllergyBadge
            allergies={child.allergies}
            childName={`${child.firstName} ${child.lastName}`}
            size="md"
            dietaryRestrictions={child.dietaryRestrictions}
            medicalNotes={child.medicalNotes}
            medications={child.medications}
            bloodType={child.bloodType}
            pediatricianName={child.pediatricianName}
            pediatricianPhone={child.pediatricianPhone}
          />
        </div>
      )}

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Core Personal & Demographic Details (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-low flex flex-col gap-4">
            <div className="flex items-center gap-4 pb-3 border-b border-surface-container-low">
              <PhotoUploadAvatar
                currentPhotoUrl={child.photoUrl}
                name={`${child.firstName} ${child.lastName}`}
                id={child.id}
                size="md"
                editable={isAdmin}
                onPhotoUploaded={async (newUrl) => {
                  await updatePhoto(child.id, newUrl);
                }}
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-on-surface">
                    {child.firstName} {child.lastName}
                  </h2>
                  {child.gender && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant">
                      {child.gender}
                    </span>
                  )}
                </div>
                <span className="text-xs text-outline">
                  Enrolled: {new Date(child.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-surface-container-low">
                <span className="text-[11px] font-semibold text-outline uppercase block">Date of Birth</span>
                <span className="text-sm text-on-surface font-semibold font-mono mt-0.5 block">
                  {child.dateOfBirth || 'Not specified'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low">
                <span className="text-[11px] font-semibold text-outline uppercase block">Blood Type</span>
                <span className="text-sm text-on-surface font-semibold mt-0.5 block">
                  {child.bloodType || 'Unknown / Not Tested'}
                </span>
              </div>

              {child.dietaryRestrictions && (
                <div className="p-3 rounded-lg bg-surface-container-low sm:col-span-2">
                  <span className="text-[11px] font-semibold text-outline uppercase block">Dietary Restrictions</span>
                  <span className="text-sm text-on-surface font-semibold mt-0.5 block">
                    {child.dietaryRestrictions}
                  </span>
                </div>
              )}

              {child.medications && (
                <div className="p-3 rounded-lg bg-surface-container-low sm:col-span-2">
                  <span className="text-[11px] font-semibold text-outline uppercase block">Ongoing Medications</span>
                  <span className="text-sm text-on-surface font-semibold mt-0.5 block">
                    {child.medications}
                  </span>
                </div>
              )}

              {child.medicalNotes && (
                <div className="p-3 rounded-lg bg-surface-container-low sm:col-span-2">
                  <span className="text-[11px] font-semibold text-outline uppercase block">Medical / Health Notes</span>
                  <span className="text-xs text-on-surface mt-0.5 block leading-relaxed">
                    {child.medicalNotes}
                  </span>
                </div>
              )}

              {child.pediatricianName && (
                <div className="p-3 rounded-lg bg-surface-container-low sm:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-outline uppercase block">Pediatrician</span>
                    <span className="text-sm text-on-surface font-bold mt-0.5 block">
                      {child.pediatricianName}
                    </span>
                  </div>
                  {child.pediatricianPhone && (
                    <a
                      href={`tel:${child.pediatricianPhone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold no-underline transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">call</span>
                      <span>{child.pediatricianPhone}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Operations Strip */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-low flex flex-col gap-3">
            <h3 className="text-sm font-bold text-on-surface">
              Quick Operations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to={`/attendance/child/${child.id}`}
                className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface flex flex-col gap-1 no-underline transition-colors"
              >
                <span className="material-symbols-outlined text-primary text-[20px]">how_to_reg</span>
                <span className="text-xs font-semibold">Attendance Log</span>
                <span className="text-[11px] text-outline">Check in / check out</span>
              </Link>
              <Link
                to="/meals"
                className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface flex flex-col gap-1 no-underline transition-colors"
              >
                <span className="material-symbols-outlined text-secondary text-[20px]">restaurant</span>
                <span className="text-xs font-semibold">Log Meal</span>
                <span className="text-[11px] text-outline">Dietary &amp; portion</span>
              </Link>
              <Link
                to="/activities"
                className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface flex flex-col gap-1 no-underline transition-colors"
              >
                <span className="material-symbols-outlined text-amber-600 text-[20px]">event_note</span>
                <span className="text-xs font-semibold">Log Activity</span>
                <span className="text-[11px] text-outline">Nap &amp; milestones</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Card: Primary Guardian & Family Circle (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-low flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-container-low">
              <span className="material-symbols-outlined text-primary text-[20px]">family_restroom</span>
              <h3 className="text-sm font-bold text-on-surface">
                Family Circle &amp; Authorized Pickups
              </h3>
            </div>

            {child.guardians && child.guardians.length > 0 ? (
              <div className="space-y-3 pt-1">
                {child.guardians.map((g, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-on-surface">
                            {g.firstName} {g.lastName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {g.relationship || 'Guardian'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {g.isPrimary && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Primary Contact
                            </span>
                          )}
                          {g.isSecondary && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              Secondary Contact
                            </span>
                          )}
                          {g.isEmergencyContact && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Emergency Contact
                            </span>
                          )}
                          {g.isAuthorizedPickup && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                              Authorized Pickup
                            </span>
                          )}
                        </div>
                      </div>

                      {g.phone && (
                        <a
                          href={`tel:${g.phone}`}
                          className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                          title={`Call ${g.firstName}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">call</span>
                        </a>
                      )}
                    </div>

                    {g.pickupPin && (
                      <div className="text-[11px] text-outline font-mono pt-1 border-t border-surface-container">
                        Pickup PIN: <strong className="text-primary tracking-widest">{g.pickupPin}</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : child.guardianId ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-on-surface block">
                      {child.guardianName || 'Authorized Contact'}
                    </span>
                    <span className="text-[11px] text-outline uppercase font-mono">
                      Authorized Pickup
                    </span>
                  </div>
                  <Link
                    to={`/guardians/${child.guardianId}`}
                    className="px-3 py-1 rounded-lg bg-secondary/10 hover:bg-secondary text-secondary hover:text-white font-semibold text-xs transition-colors no-underline"
                  >
                    View Guardian
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-outline text-xs">
                No primary guardian assigned to this record.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Child Daily History Aggregate Card (Section 4.5 & Workflow 4) */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-low flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container-low">
          <div>
            <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">history_edu</span>
              <span>Daily History Aggregate</span>
            </h3>
            <p className="text-xs text-outline mt-0.5">
              Attendance, meals, and daily activities recorded for the selected date
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={historyDate}
              onChange={(e) => setHistoryDate(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container font-mono cursor-pointer"
            />
            <button
              type="button"
              onClick={() => {
                if (childId) {
                  setHistoryLoading(true);
                  childrenApi.getDailyHistory(childId, historyDate)
                    .then(setDailyHistory)
                    .finally(() => setHistoryLoading(false));
                }
              }}
              className="p-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer"
              title="Refresh daily history"
            >
              <span className={`material-symbols-outlined text-[18px] ${historyLoading ? 'animate-spin' : ''}`}>
                refresh
              </span>
            </button>
          </div>
        </div>

        {historyError && (
          <div className="p-3 rounded-lg bg-error-container/30 border border-error/20 text-error text-xs font-semibold">
            {historyError}
          </div>
        )}

        {/* 3-Column Daily History Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Attendance Card */}
          <div className="p-4 rounded-xl bg-surface-container-low/70 border border-surface-container-low flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">fact_check</span>
                Attendance
              </span>
              {dailyHistory?.attendance?.isPresent ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Present
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-outline text-[10px] font-bold">
                  Not Recorded
                </span>
              )}
            </div>

            {dailyHistory?.attendance ? (
              <div className="flex flex-col gap-1.5 text-xs pt-1">
                <div className="flex justify-between">
                  <span className="text-outline">Arrival:</span>
                  <span className="font-semibold text-on-surface font-mono">
                    {dailyHistory.attendance.arrivalTime
                      ? new Date(dailyHistory.attendance.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Departure:</span>
                  <span className="font-semibold text-on-surface font-mono">
                    {dailyHistory.attendance.departureTime
                      ? new Date(dailyHistory.attendance.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Still in Center'}
                  </span>
                </div>
                {dailyHistory.attendance.recordedByName && (
                  <div className="flex justify-between">
                    <span className="text-outline">Educator:</span>
                    <span className="font-medium text-on-surface">
                      {dailyHistory.attendance.recordedByName}
                    </span>
                  </div>
                )}
                {dailyHistory.attendance.note && (
                  <div className="mt-1 pt-1 border-t border-surface-container text-[11px] text-on-surface-variant italic">
                    "{dailyHistory.attendance.note}"
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-outline py-2">No attendance registered on this date.</p>
            )}
          </div>

          {/* 2. Meals Card */}
          <div className="p-4 rounded-xl bg-surface-container-low/70 border border-surface-container-low flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">restaurant</span>
                Meals ({dailyHistory?.meals?.length || 0})
              </span>
            </div>

            {dailyHistory?.meals && dailyHistory.meals.length > 0 ? (
              <div className="flex flex-col gap-2 pt-1 max-h-48 overflow-y-auto">
                {dailyHistory.meals.map((meal) => (
                  <div key={meal.id} className="p-2 rounded-lg bg-surface-container-lowest border border-surface-container text-xs flex flex-col gap-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-on-surface">
                        {mealTypeToString(meal.type)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container font-medium text-on-surface-variant">
                        {mealStatusToString(meal.status)}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate">{meal.food}</p>
                    {meal.staffName && (
                      <span className="text-[10px] text-outline">Served by {meal.staffName}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-outline py-2">No meals logged on this date.</p>
            )}
          </div>

          {/* 3. Activities Card */}
          <div className="p-4 rounded-xl bg-surface-container-low/70 border border-surface-container-low flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-600">event_note</span>
                Activities ({dailyHistory?.activities?.length || 0})
              </span>
            </div>

            {dailyHistory?.activities && dailyHistory.activities.length > 0 ? (
              <div className="flex flex-col gap-2 pt-1 max-h-48 overflow-y-auto">
                {dailyHistory.activities.map((act) => (
                  <div key={act.id} className="p-2 rounded-lg bg-surface-container-lowest border border-surface-container text-xs flex flex-col gap-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-on-surface">
                        {activityTypeToString(act.activityType)}
                      </span>
                      <span className="text-[10px] text-outline font-mono">
                        {new Date(act.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant line-clamp-1">{act.activityDescription}</p>
                    {act.note && <p className="text-[10px] text-outline italic">"{act.note}"</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-outline py-2">No activities logged on this date.</p>
            )}
          </div>
        </div>
      </div>

      {/* Incidents & Care Notices Section */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-low flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-container-low gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">medical_services</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-on-surface">
                Care & Incident Log History
              </h2>
              <p className="text-[11px] text-outline">
                Documented playground events, minor scrapes, and signed guardian care notices
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowIncidentModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Record Incident Notice</span>
          </button>
        </div>

        {incidentsLoading ? (
          <div className="py-8 text-center text-outline text-xs flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            <span>Loading care notices...</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="py-8 text-center bg-surface-container-low/40 rounded-xl border border-dashed border-surface-container text-xs text-outline space-y-1">
            <span className="material-symbols-outlined text-[24px] text-emerald-600">health_and_safety</span>
            <p className="font-semibold text-on-surface">No Incidents Documented</p>
            <p className="text-[11px]">This student has a clean care record with zero injuries or accidents reported.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-4 rounded-xl bg-surface-container-low/70 border border-surface-container flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        inc.severity === 2
                          ? 'bg-red-600 text-white'
                          : inc.severity === 1
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {inc.severityName || (inc.severity === 2 ? 'Critical' : inc.severity === 1 ? 'Moderate' : 'Minor')}
                    </span>
                    <span className="text-[11px] text-outline font-mono">
                      {new Date(inc.incidentTime).toLocaleDateString()} ·{' '}
                      {new Date(inc.incidentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-on-surface">
                      {inc.incidentType}
                    </h3>
                    <p className="text-[11px] text-outline">
                      Location: {inc.location}
                    </p>
                  </div>

                  <p className="text-xs text-on-surface-variant line-clamp-2">
                    {inc.description}
                  </p>

                  {inc.firstAidAdministered && (
                    <div className="p-2 rounded-lg bg-surface-container-lowest text-[11px] text-on-surface-variant border border-surface-container-low">
                      <span className="font-bold block text-[10px] text-outline uppercase">First Aid Administered:</span>
                      {inc.firstAidAdministered}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-surface-container flex items-center justify-between text-[11px]">
                  <span className="text-outline truncate">
                    By: {inc.reportedByStaffName || 'Staff'}
                  </span>

                  {inc.isAcknowledgedByParent ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>Signed by {inc.parentSignatureName || 'Parent'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span>Pending Guardian Signature</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LogIncidentModal
        initialChildId={child.id}
        isOpen={showIncidentModal}
        onClose={() => setShowIncidentModal(false)}
        onSuccess={() => {
          incidentsApi.getByChild(child.id).then(setIncidents);
        }}
      />
    </div>
  );
};
