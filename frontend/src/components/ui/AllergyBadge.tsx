import React, { useState } from 'react';
import type { ChildAllergy } from '../../modules/children/types';
import { Modal } from './Modal';

export interface AllergyBadgeProps {
  allergies?: (ChildAllergy | string)[] | null;
  childName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  dietaryRestrictions?: string;
  medicalNotes?: string;
  medications?: string;
  bloodType?: string;
  pediatricianName?: string;
  pediatricianPhone?: string;
}

export const AllergyBadge: React.FC<AllergyBadgeProps> = ({
  allergies,
  childName,
  className = '',
  size = 'md',
  showLabel = true,
  dietaryRestrictions,
  medicalNotes,
  medications,
  bloodType,
  pediatricianName,
  pediatricianPhone,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!allergies || allergies.length === 0) {
    return null;
  }

  // Normalize allergies to ChildAllergy objects
  const normalizedAllergies: ChildAllergy[] = allergies.map((item, idx) => {
    if (typeof item === 'string') {
      return {
        id: `allergy-${idx}`,
        allergen: item,
        severity: 'Severe',
        actionPlan: 'Avoid contact and ingestions. Monitor for reactions.',
      };
    }
    return item;
  });

  const hasLifeThreatening = normalizedAllergies.some(
    (a) => a.severity === 'LifeThreatening' || a.hasEpiPen
  );

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'text-[13px]',
    md: 'text-[15px]',
    lg: 'text-[18px]',
  }[size];

  // Tooltip preview
  const tooltipText = `Allergy Alert: ${normalizedAllergies.map((a) => a.allergen).join(', ')}. Click for Emergency Plan.`;

  return (
    <>
      <button
        type="button"
        title={tooltipText}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setIsOpen(true);
        }}
        className={`inline-flex items-center font-bold rounded-full transition-all cursor-pointer select-none shadow-xs active:scale-95 ${
          hasLifeThreatening
            ? 'bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400/50 animate-pulse'
            : 'bg-red-500 hover:bg-red-600 text-white'
        } ${sizeStyles} ${className}`}
      >
        <span className={`material-symbols-outlined shrink-0 ${iconSizes}`}>
          {hasLifeThreatening ? 'shield_with_heart' : 'health_and_safety'}
        </span>
        {showLabel && (
          <span className="truncate max-w-[120px]">
            {normalizedAllergies.length === 1
              ? normalizedAllergies[0].allergen
              : `${normalizedAllergies.length} Allergies`}
          </span>
        )}
      </button>

      {/* Emergency Medical Details Modal */}
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Emergency Medical & Allergy Profile"
          maxWidth="lg"
        >
          <div className="space-y-5 text-left" onClick={(e) => e.stopPropagation()}>
            {/* Red Alert Banner */}
            <div className="p-4 rounded-xl bg-red-600 text-white shadow-sm flex items-start gap-3">
              <span className="material-symbols-outlined text-[28px] shrink-0 text-red-100">
                warning
              </span>
              <div>
                <h3 className="font-black text-base tracking-wide uppercase">
                  {childName ? `${childName}'s Critical Health Alert` : 'Critical Medical Alert'}
                </h3>
                <p className="text-xs text-red-100 mt-0.5 leading-relaxed">
                  Immediately verify food items, environment, and physical symptoms. In case of severe
                  reaction, refer to the emergency action plans below and notify emergency contacts.
                </p>
              </div>
            </div>

            {/* Blood Type & Quick Info Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {bloodType && (
                <div className="px-3 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">bloodtype</span>
                  <span>Blood Type: {bloodType}</span>
                </div>
              )}
              {hasLifeThreatening && (
                <div className="px-3 py-1 rounded-lg bg-red-100 text-red-800 border border-red-300 text-xs font-black flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">priority_high</span>
                  <span>ANAPHYLAXIS PROTOCOL</span>
                </div>
              )}
            </div>

            {/* Allergies Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-red-500">
                  coronavirus
                </span>
                <span>Active Allergens &amp; Action Plans</span>
              </h4>

              <div className="space-y-3">
                {normalizedAllergies.map((allergy, i) => (
                  <div
                    key={allergy.id || i}
                    className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-600 text-[20px]">
                          shield
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          {allergy.allergen}
                        </span>
                      </div>

                      {/* Severity Pill */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          allergy.severity === 'LifeThreatening'
                            ? 'bg-red-600 text-white'
                            : allergy.severity === 'Severe'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                            : allergy.severity === 'Moderate'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {allergy.severity === 'LifeThreatening'
                          ? '⚡ Life-Threatening'
                          : allergy.severity}
                      </span>
                    </div>

                    {allergy.reaction && (
                      <div className="text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-slate-100">Reaction: </span>
                        <span>{allergy.reaction}</span>
                      </div>
                    )}

                    {/* Epi-Pen Banner */}
                    {allergy.hasEpiPen && (
                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-start gap-2">
                        <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0">
                          vaccines
                        </span>
                        <div>
                          <div className="font-bold uppercase tracking-wider">
                            Epi-Pen Auto-Injector Required
                          </div>
                          <div className="text-amber-800 dark:text-amber-300 mt-0.5">
                            Location: {allergy.epiPenLocation || 'Classroom First Aid Cabinet'}
                          </div>
                        </div>
                      </div>
                    )}

                    {allergy.actionPlan && (
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                        <div className="font-bold text-red-600 dark:text-red-400 mb-0.5 uppercase text-[10px] tracking-wider">
                          Emergency Action Plan:
                        </div>
                        <div className="leading-relaxed">{allergy.actionPlan}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Medical Context */}
            {(dietaryRestrictions || medicalNotes || medications) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                {dietaryRestrictions && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Dietary Restrictions
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {dietaryRestrictions}
                    </span>
                  </div>
                )}
                {medications && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Ongoing Medications
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {medications}
                    </span>
                  </div>
                )}
                {medicalNotes && (
                  <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Medical / Health Notes
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 block">
                      {medicalNotes}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Pediatrician Info */}
            {pediatricianName && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Pediatrician
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {pediatricianName}
                  </span>
                </div>
                {pediatricianPhone && (
                  <a
                    href={`tel:${pediatricianPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold no-underline shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">call</span>
                    <span>{pediatricianPhone}</span>
                  </a>
                )}
              </div>
            )}

            {/* Footer Close */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Close Emergency View
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
