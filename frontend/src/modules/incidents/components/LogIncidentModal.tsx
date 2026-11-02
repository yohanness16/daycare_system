import React, { useState } from 'react';
import { useChildren } from '../../children/useChildren';
import { incidentsApi } from '../incidentsApi';
import type { CreateIncidentDto, IncidentReport, IncidentSeverity } from '../types';

interface LogIncidentModalProps {
  initialChildId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (incident: IncidentReport) => void;
}

const COMMON_TYPES = [
  'Minor Injury / Fall',
  'Scrape / Cut',
  'Bump / Bruise',
  'Bite Mark',
  'Allergic Reaction',
  'Sudden Fever / Illness',
  'Other',
];

const LOCATIONS = [
  'Playground & Climbing Area',
  'Classroom Activity Floor',
  'Nap Room',
  'Dining / Snack Area',
  'Restroom / Washroom',
  'Hallway / Entrance',
];

export const LogIncidentModal: React.FC<LogIncidentModalProps> = ({
  initialChildId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { children } = useChildren();

  const [childId, setChildId] = useState(initialChildId || '');
  const [incidentType, setIncidentType] = useState(COMMON_TYPES[0]);
  const [customType, setCustomType] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [severity, setSeverity] = useState<IncidentSeverity>(0);
  const [description, setDescription] = useState('');
  const [firstAid, setFirstAid] = useState('');
  const [witnesses, setWitnesses] = useState('');
  const [notifyMethod, setNotifyMethod] = useState('App');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childId) {
      setError('Please select a student.');
      return;
    }
    if (!description.trim()) {
      setError('Please describe what happened.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const resolvedType = incidentType === 'Other' && customType.trim() ? customType.trim() : incidentType;

      const payload: CreateIncidentDto = {
        childId,
        incidentType: resolvedType,
        location,
        severity,
        description: description.trim(),
        firstAidAdministered: firstAid.trim(),
        witnessStaffNames: witnesses.trim() || undefined,
        parentNotified: true,
        parentNotifiedMethod: notifyMethod,
      };

      const result = await incidentsApi.create(payload);
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface-container-lowest dark:bg-slate-900 border border-surface-container dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-low dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[22px]">medical_services</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface dark:text-white">
                Log Incident & Care Notice
              </h2>
              <p className="text-xs text-outline">Official care log dispatched to guardians & administration</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-outline hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Child Selection */}
          {!initialChildId && (
            <div>
              <label className="block font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-1">
                Student *
              </label>
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800 border border-surface-container dark:border-slate-700 text-on-surface dark:text-white font-medium"
              >
                <option value="">Select Child...</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.guardianName || 'Guardian Link'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Severity Radio Tiles */}
          <div>
            <label className="block font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Severity Level *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity(0)}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  severity === 0
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold shadow-xs'
                    : 'border-surface-container dark:border-slate-700 hover:bg-surface-container-low text-outline'
                }`}
              >
                <span className="block font-bold">Minor</span>
                <span className="text-[10px] opacity-75">Small bump, bandaid</span>
              </button>

              <button
                type="button"
                onClick={() => setSeverity(1)}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  severity === 1
                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold shadow-xs'
                    : 'border-surface-container dark:border-slate-700 hover:bg-surface-container-low text-outline'
                }`}
              >
                <span className="block font-bold">Moderate</span>
                <span className="text-[10px] opacity-75">Ice pack, monitoring</span>
              </button>

              <button
                type="button"
                onClick={() => setSeverity(2)}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  severity === 2
                    ? 'border-red-500 bg-red-50/60 dark:bg-red-950/40 text-red-900 dark:text-red-200 font-bold shadow-xs'
                    : 'border-surface-container dark:border-slate-700 hover:bg-surface-container-low text-outline'
                }`}
              >
                <span className="block font-bold">Critical</span>
                <span className="text-[10px] opacity-75">Urgent pickup / clinic</span>
              </button>
            </div>
          </div>

          {/* Type & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-1">
                Incident Nature
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800 border border-surface-container dark:border-slate-700 text-on-surface dark:text-white"
              >
                {COMMON_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-1">
                Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800 border border-surface-container dark:border-slate-700 text-on-surface dark:text-white"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {incidentType === 'Other' && (
            <div>
              <label className="block font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-1">
                Specify Incident Type
              </label>
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="e.g. Scratched by playdough tool"
                className="w-full p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800 border border-surface-container dark:border-slate-700 text-on-surface dark:text-white"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-1">
              Description of Event *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="State exactly what happened, circumstances, and child's behavior..."
              className="w-full p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800 border border-surface-container dark:border-slate-700 text-on-surface dark:text-white"
            />
          </div>

          {/* First Aid Administered */}
          <div>
            <label className="block font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-1">
              First Aid & Action Administered
            </label>
            <textarea
              rows={2}
              value={firstAid}
              onChange={(e) => setFirstAid(e.target.value)}
              placeholder="Cleaned with saline, applied cold pack for 5 mins, comforted..."
              className="w-full p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800 border border-surface-container dark:border-slate-700 text-on-surface dark:text-white"
            />
          </div>

          {/* Witnesses & Notify Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-1">
                Witness Staff Names
              </label>
              <input
                type="text"
                value={witnesses}
                onChange={(e) => setWitnesses(e.target.value)}
                placeholder="e.g. Ms. Sarah, Mr. Oliver"
                className="w-full p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800 border border-surface-container dark:border-slate-700 text-on-surface dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface dark:text-slate-300 uppercase tracking-wider mb-1">
                Parent Notification Channel
              </label>
              <select
                value={notifyMethod}
                onChange={(e) => setNotifyMethod(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800 border border-surface-container dark:border-slate-700 text-on-surface dark:text-white"
              >
                <option value="App">Mobile App & Real-Time Alert</option>
                <option value="Phone">Phone Call Placed</option>
                <option value="InPerson">In-Person at Pickup</option>
              </select>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-surface-container dark:border-slate-700 hover:bg-surface-container-low font-semibold text-outline cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Publishing Notice...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Publish Incident Care Notice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
