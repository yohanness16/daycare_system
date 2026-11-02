import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useChildren } from '../../children/useChildren';
import { useClassrooms } from '../../classrooms/useClassrooms';
import { useEnrollment } from '../useEnrollment';

export const EnrollmentListPage: React.FC = () => {
  const { enrollments, totalCount, enrollChild, transferChild, endEnrollment } = useEnrollment();
  const { children } = useChildren();
  const { classrooms } = useClassrooms();

  const [childId, setChildId] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const [transferTargetChild, setTransferTargetChild] = useState('');
  const [transferTargetClassroom, setTransferTargetClassroom] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Ended'>('All');

  const filteredEnrollments = enrollments.filter((e) => {
    if (statusFilter === 'Active') return e.status === 'Active';
    if (statusFilter === 'Ended') return e.status !== 'Active';
    return true;
  });

  const activeCount = enrollments.filter((e) => e.status === 'Active').length;

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    const targetChildId = childId || children[0]?.id;
    const targetRoomId = classroomId || classrooms[0]?.id;
    if (!targetChildId || !targetRoomId) return;

    const child = children.find((c) => c.id === targetChildId);
    const room = classrooms.find((r) => r.id === targetRoomId);
    if (!child || !room) return;

    enrollChild(
      { childId: targetChildId, classroomId: targetRoomId, enrollmentDate },
      `${child.firstName} ${child.lastName}`,
      room.name
    );
    setShowEnrollModal(false);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetChild || !transferTargetClassroom) return;
    const room = classrooms.find((r) => r.id === transferTargetClassroom);
    if (!room) return;

    transferChild(
      { childId: transferTargetChild, newClassroomId: transferTargetClassroom },
      room.name
    );
    setShowTransferModal(false);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">
            Enrollment
          </h1>
          <p className="text-xs text-outline mt-0.5">
            Classroom allocations, transfers, and enrollment records
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">swap_horiz</span>
            <span>Transfer Room</span>
          </button>
          <button
            type="button"
            onClick={() => setShowEnrollModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Enroll Student</span>
          </button>
        </div>
      </div>

      {/* 2 Clean Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Active Enrollments</span>
            <div className="text-xl font-bold text-on-surface mt-0.5">{activeCount} Placements</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Total History</span>
            <div className="text-xl font-bold text-secondary mt-0.5">{totalCount} Records</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">history_edu</span>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-low overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="p-3 border-b border-surface-container-low flex items-center justify-between gap-3 bg-surface-container-lowest">
          <div className="flex items-center gap-1.5">
            {(['All', 'Active', 'Ended'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === filter
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <span className="text-xs text-outline font-medium">
            Showing {filteredEnrollments.length} enrollments
          </span>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-container-low text-outline uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Classroom</th>
                <th className="py-2.5 px-3">Enrollment Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-outline text-xs">
                    No enrollment records found.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-on-surface">
                      <Link to={`/children/${e.childId}`} className="text-on-surface hover:text-primary no-underline">
                        {e.childName}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-on-surface-variant">
                      <Link to={`/classrooms/${e.classroomId}`} className="text-primary hover:underline no-underline">
                        {e.classroomName}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-outline font-mono-data">
                      {e.enrollmentDate}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          e.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {e.status === 'Active' && (
                        <button
                          type="button"
                          onClick={() => endEnrollment(e.id)}
                          className="px-2 py-1 rounded bg-surface-container-low hover:bg-surface-container text-outline hover:text-error text-[11px] font-semibold cursor-pointer"
                        >
                          End Enrollment
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-5 shadow-xl border border-surface-container flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
              <h2 className="text-base font-bold text-on-surface">Enroll Student</h2>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleEnroll} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Child <span className="text-red-500">*</span>
                </label>
                <select
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                  required
                >
                  <option value="">-- Select Child --</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Classroom Assignment <span className="text-red-500">*</span>
                </label>
                <select
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                  required
                >
                  <option value="">-- Select Classroom --</option>
                  {classrooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Cap: {r.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Enrollment Date
                </label>
                <input
                  type="date"
                  value={enrollmentDate}
                  onChange={(e) => setEnrollmentDate(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container-low">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-xs text-on-primary font-semibold cursor-pointer"
                >
                  Enroll Child
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Student Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-5 shadow-xl border border-surface-container flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
              <h2 className="text-base font-bold text-on-surface">Transfer Classroom</h2>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Enrolled Child <span className="text-red-500">*</span>
                </label>
                <select
                  value={transferTargetChild}
                  onChange={(e) => setTransferTargetChild(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                  required
                >
                  <option value="">-- Select Child to Transfer --</option>
                  {filteredEnrollments
                    .filter((e) => e.status === 'Active')
                    .map((e) => (
                      <option key={e.childId} value={e.childId}>
                        {e.childName} (Current: {e.classroomName})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  New Target Classroom <span className="text-red-500">*</span>
                </label>
                <select
                  value={transferTargetClassroom}
                  onChange={(e) => setTransferTargetClassroom(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                  required
                >
                  <option value="">-- Select New Classroom --</option>
                  {classrooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Cap: {r.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container-low">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-xs text-on-primary font-semibold cursor-pointer"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
