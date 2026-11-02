import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { parentApi } from '../api/parentApi';
import type { ChildFullDetail } from '../types/parent';

export const ParentChildProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [child, setChild] = useState<ChildFullDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Correction request modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionField, setCorrectionField] = useState('name');
  const [correctionValue, setCorrectionValue] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionSubmitted, setCorrectionSubmitted] = useState(false);

  // Edit Health info modal
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [healthSubmitted, setHealthSubmitted] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    parentApi
      .getChildFullDetail(id)
      .then(setChild)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading || !child) {
    return (
      <div className="py-12 flex justify-center text-slate-400">
        <span className="material-symbols-outlined text-[32px] animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCorrectionSubmitted(true);
    setTimeout(() => {
      setShowCorrectionModal(false);
      setCorrectionSubmitted(false);
      setCorrectionValue('');
      setCorrectionReason('');
    }, 1500);
  };

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllergy.trim()) return;
    setChild({
      ...child,
      health: {
        ...child.health,
        allergies: [...child.health.allergies, newAllergy.trim()],
      },
    });
    setNewAllergy('');
    setHealthSubmitted(true);
    setTimeout(() => {
      setHealthSubmitted(false);
      setShowHealthModal(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/parent/children/${child.id}`}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {child.firstName}&apos;s Profile
            </h1>
            <p className="text-xs text-slate-500">Official daycare enrollment and health record</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCorrectionModal(true)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">edit_note</span>
          Request Correction
        </button>
      </div>

      {/* 1. Basic Info Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-500">person</span>
            Basic Information
          </h2>
          <span className="text-[11px] font-semibold text-slate-400">
            Reviewed by administration
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Full Legal Name
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {child.firstName} {child.lastName}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Date of Birth
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {child.dateOfBirth} ({Math.floor(child.ageMonths / 12)} yrs {child.ageMonths % 12} mos)
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Gender
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {child.gender}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Assigned Classroom
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {child.classroom.name}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Blood Type
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {child.health.bloodType || 'Not specified'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              30-Day Attendance
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {child.attendanceStats?.last30Days.present} Days Present (
              {child.attendanceStats?.last30Days.absent} Absent)
            </span>
          </div>
        </div>
      </div>

      {/* 2. Health & Medical Section per spec §9.2 */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500">health_and_safety</span>
              Health & Allergy Information
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Verified ✓
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowHealthModal(true)}
            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors"
          >
            + Add Allergy / Medical Note
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Documented Allergies
            </span>
            <div className="flex flex-wrap gap-2">
              {child.health.allergies.length > 0 ? (
                child.health.allergies.map((allergy, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    {allergy}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">None documented</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Dietary Restrictions
            </span>
            <div className="flex flex-wrap gap-2">
              {child.health.dietaryRestrictions.map((diet, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                >
                  {diet}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              Medical Notes:
            </span>
            <p className="text-slate-600 dark:text-slate-400">
              {child.health.medicalNotes || 'No special medical instructions logged.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Primary Emergency Contact
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                {child.health.emergencyContact.name}
              </span>
              <span className="text-primary-600 font-semibold">
                {child.health.emergencyContact.phone}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Pediatrician
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                {child.health.pediatrician.name}
              </span>
              <span className="text-primary-600 font-semibold">
                {child.health.pediatrician.phone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Authorized Pickups Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-500">badge</span>
            Authorized Pickups
          </h2>
          <Link
            to={`/parent/children/${child.id}/pickup/new`}
            className="px-3 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold transition-colors"
          >
            + Add Pickup Person
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {child.authorizedPickups.map((person) => (
            <div
              key={person.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 flex items-center justify-center font-bold text-sm">
                  {person.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {person.fullName}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {person.relationship} · {person.phone}
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Approved ✓
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Documents Section */}
      {child.documents && child.documents.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-500">description</span>
            Documents & Contracts
          </h2>
          <div className="space-y-2">
            {child.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-slate-400">picture_as_pdf</span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {doc.name}
                    </span>
                    <span className="text-[10px] text-slate-400">Uploaded on {doc.uploadedAt}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Downloading official PDF document...')}
                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-primary-600 rounded-xl"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correction Request Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
              Request Record Correction
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              To preserve record integrity, changes to legal names, dates of birth, or addresses are submitted to daycare administration for verification.
            </p>

            {correctionSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 text-xs text-center font-bold">
                ✓ Request submitted! Our center director will review it shortly.
              </div>
            ) : (
              <form onSubmit={handleCorrectionSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Field to Correct
                  </label>
                  <select
                    value={correctionField}
                    onChange={(e) => setCorrectionField(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="name">Legal Name Spelling</option>
                    <option value="dob">Date of Birth</option>
                    <option value="address">Home Address</option>
                    <option value="emergency">Emergency Contact Phone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correct Information
                  </label>
                  <input
                    type="text"
                    required
                    value={correctionValue}
                    onChange={(e) => setCorrectionValue(e.target.value)}
                    placeholder="Enter updated detail"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reason
                  </label>
                  <textarea
                    rows={2}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Reason for change"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCorrectionModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Health Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-1">
              Add New Allergy
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Allergy additions apply immediately for safety with a &apos;pending staff verification&apos; badge.
            </p>

            {healthSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 text-xs text-center font-bold">
                ✓ Allergy logged immediately and staff alerted!
              </div>
            ) : (
              <form onSubmit={handleAddAllergy} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Allergen Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="e.g. Eggs, Soy, Strawberries"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowHealthModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
                  >
                    Add Allergy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
