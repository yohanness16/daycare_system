import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useParentChild } from '../context/ParentChildContext';
import { parentApi } from '../api/parentApi';
import { ComplaintCategory, ComplaintPriority } from '../types/parent';

export const ParentNewComplaintPage: React.FC = () => {
  const { childrenList, activeChild } = useParentChild();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<ComplaintCategory>(ComplaintCategory.Meals);
  const [childId, setChildId] = useState(activeChild?.childId || '');
  const [aboutStaff, setAboutStaff] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>(ComplaintPriority.Normal);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRef, setCreatedRef] = useState<string | null>(null);

  const categories = [
    { cat: ComplaintCategory.Safety, label: 'Safety & Well-Being 🛡️', desc: 'Equipment, supervision, physical safety' },
    { cat: ComplaintCategory.StaffConduct, label: 'Staff Conduct 👥', desc: 'Behavior or communication with a staff member' },
    { cat: ComplaintCategory.Meals, label: 'Meals & Allergies 🍽️', desc: 'Food quality, allergens, portions' },
    { cat: ComplaintCategory.Cleanliness, label: 'Hygiene & Cleanliness 🧼', desc: 'Sanitization, diapering, classroom state' },
    { cat: ComplaintCategory.Communication, label: 'Communication 📢', desc: 'Reports, responsiveness, notices' },
    { cat: ComplaintCategory.Billing, label: 'Billing & Tuition 💳', desc: 'Invoices, payments, enrollment rates' },
    { cat: ComplaintCategory.Curriculum, label: 'Learning & Activities 🎨', desc: 'Curriculum, milestones, toys' },
    { cat: ComplaintCategory.Facilities, label: 'Facilities & Grounds 🏢', desc: 'Gates, building maintenance, parking' },
    { cat: ComplaintCategory.Other, label: 'General / Other 📝', desc: 'Any other matter requiring review' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await parentApi.createComplaint({
        childId: childId || undefined,
        category,
        subject,
        description,
        priority: category === ComplaintCategory.Safety ? ComplaintPriority.Urgent : priority,
      });

      setCreatedRef(created.referenceNumber);
      setStep(4);
    } catch {
      alert('Failed to submit concern. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <Link
          to="/parent/complaints"
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Share a Feedback or Concern
          </h1>
          <p className="text-xs text-slate-500">
            Step {step} of 3 · We take every concern seriously
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-md">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              1. What is this concerning?
            </h2>

            {category === ComplaintCategory.Safety && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2.5">
                <span className="material-symbols-outlined text-rose-600">emergency</span>
                <span>
                  <strong>Immediate Danger?</strong> If your child is in immediate physical danger, please call 911 or call the center desk directly at (555) 234-5678.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((c) => (
                <button
                  key={c.cat}
                  type="button"
                  onClick={() => setCategory(c.cat)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    category === c.cat
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100 shadow-2xs font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-xs block font-bold">{c.label}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{c.desc}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full mt-4 h-11 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition-all"
            >
              Continue to Details →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              2. Scope & Child Context
            </h2>

            {childrenList.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Related Child (Optional)
                </label>
                <select
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="">General (Not specific to a single child)</option>
                  {childrenList.map((kid) => (
                    <option key={kid.childId} value={kid.childId}>
                      {kid.firstName} {kid.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <input
                id="about-staff"
                type="checkbox"
                checked={aboutStaff}
                onChange={(e) => setAboutStaff(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-primary-600 rounded cursor-pointer"
              />
              <label htmlFor="about-staff" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <strong>This concern is about a staff member.</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  When checked, this report is handled confidentially by daycare directorship and management only.
                </p>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Priority
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority(ComplaintPriority.Normal)}
                  className={`p-2.5 rounded-xl border text-xs font-bold ${
                    priority === ComplaintPriority.Normal
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Normal (24h SLA)
                </button>
                <button
                  type="button"
                  onClick={() => setPriority(ComplaintPriority.High)}
                  className={`p-2.5 rounded-xl border text-xs font-bold ${
                    priority === ComplaintPriority.High
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  High (8h SLA)
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-2/3 h-11 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-2xl"
              >
                Next: Description →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              3. Tell Us More
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Subject (Summary)
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your concern..."
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-400 text-right block mt-1">
                {subject.length}/150
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Detailed Explanation
              </label>
              <textarea
                rows={5}
                required
                maxLength={4000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? When did this occur? What resolution would you like to see?"
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-400 text-right block mt-1">
                {description.length}/4000
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !subject.trim() || !description.trim()}
                className="w-2/3 h-11 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-2xl"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100">
              Concern Successfully Submitted
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Reference Number:{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-mono">
                {createdRef}
              </strong>
            </p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Our leadership team has been notified. You can track updates and staff replies in the feedback center.
            </p>
            <div className="pt-3">
              <Link
                to="/parent/complaints"
                className="inline-block px-6 py-2.5 bg-primary-600 text-white font-bold text-xs rounded-2xl"
              >
                View My Concerns
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
