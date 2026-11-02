import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parentApi } from '../api/parentApi';

export const ParentHomeNotePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Slept badly');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const categories = [
    { label: 'Slept badly 🥱', val: 'Slept badly' },
    { label: 'Teething / Pain 🦷', val: 'Teething' },
    { label: 'Not hungry for breakfast 🥪', val: 'Not hungry' },
    { label: 'Feeling a bit fussy 😣', val: 'Feeling fussy' },
    { label: 'Home medicine given 💊', val: 'Medication given' },
    { label: 'Other morning update 📝', val: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await parentApi.submitHomeNote(id, {
        date,
        category,
        text,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate(`/parent/children/${id}`);
      }, 1500);
    } catch {
      alert('Could not submit note. Please try again.');
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
            Share Morning Note
          </h1>
          <p className="text-xs text-slate-500">
            Tell the classroom team about your child&apos;s evening or morning
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-md">
        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
              Note Shared With Classroom
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              This note will appear pinned on the classroom morning board for your child&apos;s teachers.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                For Date
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                What is this about?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <button
                    key={c.val}
                    type="button"
                    onClick={() => setCategory(c.val)}
                    className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                      category === c.val
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Note for Teachers
              </label>
              <textarea
                rows={4}
                required
                maxLength={1000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Damian was awake between 2 AM and 4 AM with his new canine tooth. Might need an earlier nap today..."
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 text-right block mt-1">
                {text.length}/1000 chars
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              💡 Staff will see this note upon child check-in and will mark it acknowledged once read.
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all"
            >
              {isSubmitting ? 'Sharing Note...' : 'Share Note With Teachers'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
