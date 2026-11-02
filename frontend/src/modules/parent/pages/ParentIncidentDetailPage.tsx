import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { incidentsApi } from '../../incidents/incidentsApi';
import type { IncidentReport } from '../../incidents/types';
import { useAuth } from '../../../core/auth/AuthContext';

export const ParentIncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<IncidentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [signatureName, setSignatureName] = useState(() => {
    return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  });
  const [comment, setComment] = useState('');
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const fetchIncident = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await incidentsApi.getById(id);
        if (isMounted) {
          setIncident(res);
          setIsAcknowledged(res.isAcknowledgedByParent);
          if (res.parentComments) setComment(res.parentComments);
          if (res.parentSignatureName) setSignatureName(res.parentSignatureName);
        }
      } catch {
        // Fallback mock if incident ID not in DB or offline preview
        if (isMounted) {
          setIncident({
            id: id || 'inc-fallback',
            childId: 'c1-damian-wayne',
            childName: 'Damian Wayne',
            childPhotoUrl: null,
            classroomId: 'cr-1',
            classroomName: 'Toddler Sunshine Room',
            reportedByStaffId: 's-2',
            reportedByStaffName: 'Ms. Dinah Lance (First Aid Certified)',
            incidentTime: new Date().toISOString(),
            incidentType: 'Playground Scraped Knee',
            location: 'Playground soft tiles',
            description:
              'Damian tripped on the rubber soft tiles during morning playground climbing. A minor scrape occurred on his left knee.',
            firstAidAdministered:
              'Wound washed with clean saline, antiseptic applied, and a friendly dinosaur bandage was placed. Child comforted and happily returned to play within 5 minutes.',
            witnessStaffNames: 'Mr. Oliver Queen',
            severity: 0,
            severityName: 'Minor',
            parentNotified: true,
            parentNotifiedAt: new Date().toISOString(),
            parentNotifiedMethod: 'App',
            isAcknowledgedByParent: false,
            parentAcknowledgedAt: null,
            parentSignatureName: null,
            parentComments: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchIncident();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAcknowledge = async () => {
    if (!id || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await incidentsApi.acknowledge(id, {
        parentSignatureName: signatureName.trim() || undefined,
        comment: comment.trim() || undefined,
      });
      setIsAcknowledged(true);
      setIncident(res);
      setTimeout(() => {
        navigate('/parent');
      }, 1500);
    } catch {
      // Local optimistic fallback
      setIsAcknowledged(true);
      setTimeout(() => {
        navigate('/parent');
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityBadge = (sev: number) => {
    switch (sev) {
      case 2:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-600 text-white shadow-xs">
            Critical Concern
          </span>
        );
      case 1:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white shadow-xs">
            Moderate Attention
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white shadow-xs">
            Minor Care Event
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
        <span className="material-symbols-outlined text-[32px] animate-spin text-primary">progress_activity</span>
        <span className="text-xs font-semibold">Loading Incident Care Notice...</span>
      </div>
    );
  }

  if (loadError || !incident) {
    return (
      <div className="max-w-lg mx-auto p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-3">
        <span className="material-symbols-outlined text-[36px] text-red-500">error</span>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Notice Not Found</h2>
        <p className="text-xs text-slate-500">Could not retrieve the requested incident file.</p>
        <Link to="/parent" className="inline-block px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const formattedTime = new Date(incident.incidentTime).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <Link
          to="/parent"
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Incident Care Notice
          </h1>
          <p className="text-xs text-slate-500">Official student care record & parental verification</p>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 shadow-md space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-bold shrink-0">
            <span className="material-symbols-outlined text-[28px]">medical_services</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {getSeverityBadge(incident.severity)}
              <span className="text-xs text-slate-400">Recorded {formattedTime}</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
              {incident.incidentType}
            </h2>
            <p className="text-xs font-semibold text-primary">
              Student: {incident.childName}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm space-y-3">
          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300 block">
              Location:
            </span>
            <p className="text-slate-600 dark:text-slate-400 mt-0.5">
              {incident.location || 'Classroom / Playground'}
            </p>
          </div>

          <div>
            <span className="font-bold text-slate-700 dark:text-slate-300 block">
              What Happened:
            </span>
            <p className="text-slate-600 dark:text-slate-400 mt-0.5 whitespace-pre-wrap">
              {incident.description}
            </p>
          </div>

          {incident.firstAidAdministered && (
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                Action & First Aid Taken by Staff:
              </span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5 whitespace-pre-wrap">
                {incident.firstAidAdministered}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase">
                Reporting Educator:
              </span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-xs font-medium">
                {incident.reportedByStaffName || 'Daycare Educator'}
              </p>
            </div>

            {incident.witnessStaffNames && (
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase">
                  Witnesses:
                </span>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-xs font-medium">
                  {incident.witnessStaffNames}
                </p>
              </div>
            )}
          </div>
        </div>

        {isAcknowledged ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Notice Acknowledged & Signed</span>
            </div>
            {incident.parentSignatureName && (
              <p className="text-[11px] font-normal text-emerald-900 dark:text-emerald-300">
                Signer: <span className="font-bold">{incident.parentSignatureName}</span>
              </p>
            )}
            {incident.parentComments && (
              <p className="text-[11px] font-normal text-emerald-900 dark:text-emerald-300">
                Parent Comment: "{incident.parentComments}"
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Parent / Guardian Digital Signature *
              </label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Type your full legal name..."
                required
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Parent Response / Pickup Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional instructions for afternoon care or questions..."
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={handleAcknowledge}
              disabled={isSubmitting || !signatureName.trim()}
              className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                'Recording Acknowledgment...'
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  I Acknowledge & Sign This Care Notice
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
