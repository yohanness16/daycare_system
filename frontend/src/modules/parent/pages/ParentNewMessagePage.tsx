import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useParentChild } from '../context/ParentChildContext';
import { parentApi } from '../api/parentApi';

export const ParentNewMessagePage: React.FC = () => {
  const { childrenList, activeChild } = useParentChild();
  const navigate = useNavigate();

  const [selectedChildId, setSelectedChildId] = useState(
    activeChild?.childId || childrenList[0]?.childId || ''
  );

  // Recipient: 'admin' or teacher's staffId
  const currentChild = childrenList.find((k) => k.childId === selectedChildId) || activeChild;
  const teachers = currentChild?.primaryTeachers || [];

  const [recipientType, setRecipientType] = useState<'admin' | 'teacher'>('teacher');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.staffId || ''
  );
  const [topic, setTopic] = useState('General');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topicOptions = ['General', 'Pickup & Schedule', 'Health & Medication', 'Meals & Nutrition', 'Rest & Sleep', 'Progress Inquiry'];

  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const childName = currentChild ? `${currentChild.firstName} ${currentChild.lastName}` : 'Child';
      let title = '';
      let type = 0;
      let targetStaffId: string | undefined = undefined;

      if (recipientType === 'admin') {
        type = 1;
        title = `${childName} - Center Admin Support`;
      } else {
        type = 0;
        const matchedTeacher = teachers.find((t) => t.staffId === selectedTeacherId) || teachers[0];
        targetStaffId = matchedTeacher?.staffId;
        title = matchedTeacher ? `${matchedTeacher.name} - Teacher Chat (${currentChild?.firstName})` : `Classroom Teachers (${currentChild?.firstName})`;
      }

      const convo = await parentApi.createConversation({
        childId: currentChild?.childId,
        recipientStaffId: targetStaffId,
        targetUserId: targetStaffId,
        title,
        initialMessage: `[${topic}] ${body.trim()}`,
        type,
      });

      navigate(`/parent/messages/${convo.id}`);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError('Failed to initiate conversation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-200 pb-12">
      <div className="flex items-center gap-3">
        <Link
          to="/parent/messages"
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Start a Conversation
          </h1>
          <p className="text-xs text-slate-500">
            Reach your child&apos;s assigned teacher or the Center Administration
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-md">
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleStartConversation} className="space-y-5">
          {/* Child Picker if multiple */}
          {childrenList.length > 1 ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Regarding Child
              </label>
              <select
                value={selectedChildId}
                onChange={(e) => {
                  setSelectedChildId(e.target.value);
                  const newChild = childrenList.find((k) => k.childId === e.target.value);
                  if (newChild?.primaryTeachers && newChild.primaryTeachers.length > 0) {
                    setSelectedTeacherId(newChild.primaryTeachers[0].staffId);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-medium"
              >
                {childrenList.map((kid) => (
                  <option key={kid.childId} value={kid.childId}>
                    {kid.firstName} {kid.lastName} ({kid.classroom?.name || 'Classroom'})
                  </option>
                ))}
              </select>
            </div>
          ) : currentChild ? (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">
                  REGARDING CHILD
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {currentChild.firstName} {currentChild.lastName} ({currentChild.classroom?.name || 'Classroom'})
                </span>
              </div>
              <Link
                to={`/parent/children/${currentChild.childId}/teacher`}
                className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
              >
                <span>Teacher info</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          ) : null}

          {/* Strict Recipient Picker: Admin or Child's Teacher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Authorized Recipient
              </label>
              <span className="text-[10px] font-mono text-slate-400">RESTRICTED ACCESS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option: Child's Teacher(s) */}
              <button
                type="button"
                onClick={() => setRecipientType('teacher')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  recipientType === 'teacher'
                    ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-950/40 text-primary-950 dark:text-primary-100 ring-2 ring-primary-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary-600 dark:text-primary-400 text-[20px]">
                    school
                  </span>
                  <span className="font-bold text-xs uppercase tracking-wide">Child&apos;s Teacher</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Direct classroom educator for daily care & activities
                </div>
              </button>

              {/* Option: Center Administration */}
              <button
                type="button"
                onClick={() => setRecipientType('admin')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  recipientType === 'admin'
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-[20px]">
                    shield_person
                  </span>
                  <span className="font-bold text-xs uppercase tracking-wide">Center Admin</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Director, billing, registration & center leadership
                </div>
              </button>
            </div>

            {/* If Teacher selected and multiple teachers exist, allow selecting which assigned teacher */}
            {recipientType === 'teacher' && teachers.length > 0 && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Select Classroom Educator:
                </label>
                <div className="space-y-1.5">
                  {teachers.map((t) => (
                    <label
                      key={t.staffId}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="selectedTeacher"
                        value={t.staffId}
                        checked={selectedTeacherId === t.staffId || (!selectedTeacherId && teachers[0].staffId === t.staffId)}
                        onChange={() => setSelectedTeacherId(t.staffId)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-bold text-xs flex items-center justify-center">
                        {t.name[0]}
                      </div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {t.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Topic Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Topic
            </label>
            <div className="flex flex-wrap gap-1.5">
              {topicOptions.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    topic === t
                      ? 'bg-primary-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Message Body */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Your Message
            </label>
            <textarea
              rows={4}
              required
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`Write your note regarding ${currentChild?.firstName || 'your child'}...`}
              className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Formal concern link */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Need formal escalation?</span>
            <Link
              to="/parent/complaints/new"
              className="font-bold text-primary-600 dark:text-primary-400 hover:underline"
            >
              Submit Complaint →
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !body.trim()}
            className="w-full h-12 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Initiating Conversation...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Send Message</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
