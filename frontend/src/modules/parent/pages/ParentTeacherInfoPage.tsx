import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useParentChild } from '../context/ParentChildContext';
import { parentApi } from '../api/parentApi';

export const ParentTeacherInfoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { childrenList, activeChild } = useParentChild();
  const navigate = useNavigate();

  const child = childrenList.find((c) => c.childId === id) || activeChild;
  const [startingChatWith, setStartingChatWith] = useState<string | null>(null);

  if (!child) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-500">Child information not found.</p>
        <Link
          to="/parent"
          className="inline-flex px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold"
        >
          Return to Portal
        </Link>
      </div>
    );
  }

  const handleStartChatWithTeacher = async (teacher: { staffId: string; name: string }) => {
    setStartingChatWith(teacher.staffId);
    try {
      const convo = await parentApi.createConversation({
        childId: child.childId,
        recipientStaffId: teacher.staffId,
        title: `${teacher.name} - Teacher Chat`,
        initialMessage: `Hello ${teacher.name}, I am reaching out regarding ${child.firstName} ${child.lastName}.`,
        type: 0,
      });
      navigate(`/parent/messages/${convo.id}`);
    } catch (err) {
      console.error('Failed to start chat with teacher:', err);
      alert('Unable to start conversation with teacher. Please try again.');
    } finally {
      setStartingChatWith(null);
    }
  };

  const handleStartChatWithAdmin = async () => {
    setStartingChatWith('admin');
    try {
      const convo = await parentApi.createConversation({
        childId: child.childId,
        title: `${child.firstName} ${child.lastName} - Center Admin Support`,
        initialMessage: `Hello Center Administration, I have an inquiry regarding ${child.firstName} ${child.lastName}.`,
        type: 1,
      });
      navigate(`/parent/messages/${convo.id}`);
    } catch (err) {
      console.error('Failed to start chat with admin:', err);
      alert('Unable to start conversation with admin. Please try again.');
    } finally {
      setStartingChatWith(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl mx-auto pb-12">
      {/* Top Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <Link
          to={`/parent/children/${child.childId}`}
          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Teachers & Center Administration
          </h1>
          <p className="text-xs text-slate-500">
            Assigned educators and administrative team for {child.firstName}
          </p>
        </div>
      </div>

      {/* Child & Classroom Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-black text-white shrink-0 border border-white/30">
            {child.firstName[0]}
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-primary-200 font-bold">
              CHILD ENROLLMENT CONTEXT
            </div>
            <h2 className="text-lg font-bold">
              {child.firstName} {child.lastName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-primary-100 mt-0.5">
              <span className="material-symbols-outlined text-[15px]">meeting_room</span>
              <span>{child.classroom?.name || 'Classroom Assigned'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold border border-white/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Classroom Active
          </span>
        </div>
      </div>

      {/* Teachers Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-600 text-[20px]">school</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
              Assigned Classroom Teachers ({child.primaryTeachers?.length || 0})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Authorized for direct messaging</span>
        </div>

        {child.primaryTeachers && child.primaryTeachers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {child.primaryTeachers.map((teacher) => (
              <div
                key={teacher.staffId}
                className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-base shrink-0">
                    {teacher.photoUrl ? (
                      <img
                        src={teacher.photoUrl}
                        alt={teacher.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      teacher.name[0]
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {teacher.name}
                    </h4>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                      Primary Classroom Educator
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Dedicated daily educator for {child.classroom?.name || 'Classroom'}.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => handleStartChatWithTeacher(teacher)}
                    disabled={startingChatWith === teacher.staffId}
                    className="w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    {startingChatWith === teacher.staffId ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Opening chat...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        <span>Chat with {teacher.name.split(' ')[0]}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs text-slate-500">
              No teachers currently linked to this classroom.
            </p>
          </div>
        )}
      </div>

      {/* Center Administration Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600 text-[20px]">corporate_fare</span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
            Center Administration
          </h3>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-base shrink-0">
              <span className="material-symbols-outlined text-[24px]">shield_person</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Center Administration & Support
              </h4>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Daycare Directors & Management Office
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-md">
                Chat regarding enrollment, billing, policy questions, or general center management.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartChatWithAdmin}
            disabled={startingChatWith === 'admin'}
            className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60 shrink-0"
          >
            {startingChatWith === 'admin' ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Opening chat...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">support_agent</span>
                <span>Chat with Center Admin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Guidelines Note */}
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
        <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          verified_user
        </span>
        <div className="leading-relaxed">
          <span className="font-bold">Child Privacy & Security Notice:</span> You are connected
          exclusively to educators assigned directly to {child.firstName}&apos;s classroom and the verified Center
          Administration. Conversations are securely retained for continuity of care.
        </div>
      </div>
    </div>
  );
};
