import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parentApi } from '../api/parentApi';

export const ParentPickupPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'today' | 'permanent'>('today');

  // One-time pickup form
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [personName, setPersonName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmitOneTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !personName || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await parentApi.submitPickupNotice(id, {
        date,
        personName,
        relationship,
        phone,
        note,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate(`/parent/children/${id}`);
      }, 1500);
    } catch {
      alert('Failed to submit pickup notice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <Link
          to={id ? `/parent/children/${id}` : '/parent'}
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Pickup Management
          </h1>
          <p className="text-xs text-slate-500">
            Authorize pickup individuals or notify staff for today
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'today'
              ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Today&apos;s Pickup Change
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('permanent')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'permanent'
              ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300 shadow-2xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Permanent Authorizations
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-md">
        {activeTab === 'today' ? (
          isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
                ✓
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                Pickup Notice Registered
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Classroom staff will verify photo ID at the entrance before releasing your child.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitOneTime} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0">
                  shield
                </span>
                <p>
                  <strong>Safety Protocol:</strong> Our security policy requires classroom teachers to examine a matching government-issued photo ID prior to pickup.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Pickup Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name of Pickup Person
                </label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  placeholder="e.g. Grandma Martha Wayne"
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    required
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="e.g. Aunt, Grandparent"
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Instructions for Staff (Optional)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Expected around 4:30 PM, will bring booster seat..."
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all"
              >
                {isSubmitting ? 'Submitting...' : 'Register Today’s Pickup'}
              </button>
            </form>
          )
        ) : (
          /* Permanent Pickups Tab */
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Permanent authorized pickups can pick up your child anytime after identity verification.
            </p>

            <div className="space-y-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Alfred Pennyworth
                  </h4>
                  <p className="text-[11px] text-slate-500">Grandfather · +1 (555) 928-1122</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  Approved
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Richard Grayson
                  </h4>
                  <p className="text-[11px] text-slate-500">Family Member · +1 (555) 482-7721</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  Approved
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('New permanent authorization request sent to administration.')}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary-400 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
            >
              + Add Another Permanent Authorized Person
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
