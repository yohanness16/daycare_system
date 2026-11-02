import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { staffApi } from '../../staff/staffApi';
import type { Staff } from '../../staff/types';
import { classroomsApi, type ClassroomDependentsResponse } from '../classroomsApi';
import type { ClassroomStaffAssignment } from '../types';
import { useClassrooms } from '../useClassrooms';
import { useEnrollment } from '../../enrollment/useEnrollment';
import { Modal, Button } from '../../../components/ui';

export const ClassroomDetailPage: React.FC = () => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const { getClassroomById, deleteClassroom } = useClassrooms();
  const { getEnrollmentsByClassroom } = useEnrollment();
  const navigate = useNavigate();

  // Classroom Staff State
  const [assignedStaff, setAssignedStaff] = useState<ClassroomStaffAssignment[]>([]);
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Safe delete classroom state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDependents, setDeleteDependents] = useState<ClassroomDependentsResponse | null>(null);
  const [isLoadingDependents, setIsLoadingDependents] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenDelete = async () => {
    if (!classroomId) return;
    setShowDeleteModal(true);
    setDeleteDependents(null);
    setIsLoadingDependents(true);
    try {
      const deps = await classroomsApi.getDependents(classroomId);
      setDeleteDependents(deps);
    } catch (err) {
      console.warn('Failed to load classroom dependents:', err);
      setDeleteDependents({ activeEnrollments: 0, activeStaff: 0 });
    } finally {
      setIsLoadingDependents(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!classroomId) return;
    try {
      setIsDeleting(true);
      await deleteClassroom(classroomId);
      navigate('/classrooms', { replace: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete classroom');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!classroomId) return;

    let isMounted = true;
    const fetchAssignments = async () => {
      try {
        setStaffLoading(true);
        const [assignments, allStaff] = await Promise.all([
          classroomsApi.getStaffByClassroom(classroomId, true),
          staffApi.getAll(),
        ]);
        if (isMounted) {
          setAssignedStaff(assignments);
          setAvailableStaff(allStaff);
          if (allStaff.length > 0) {
            setSelectedStaffId(allStaff[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch classroom staff:', err);
      } finally {
        if (isMounted) setStaffLoading(false);
      }
    };

    fetchAssignments();
    return () => {
      isMounted = false;
    };
  }, [classroomId]);

  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomId || !selectedStaffId) return;

    try {
      setAssignError(null);
      const newAssignment = await classroomsApi.assignStaff({
        classroomId,
        staffId: selectedStaffId,
      });
      setAssignedStaff((prev) => [...prev, newAssignment]);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Failed to assign staff.');
    }
  };

  const handleRemoveStaff = async (assignmentId: string) => {
    try {
      await classroomsApi.removeStaffAssignment(assignmentId);
      setAssignedStaff((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unassign staff.');
    }
  };

  if (!classroomId) {
    return <Navigate to="/classrooms" replace />;
  }

  const room = getClassroomById(classroomId);
  if (!room) {
    return <Navigate to="/classrooms" replace />;
  }

  const enrollments = getEnrollmentsByClassroom(room.id);
  const enrolledCount = room.currentEnrollmentCount ?? enrollments.length;
  const occupancyPercentage = room.capacity > 0 ? Math.round((enrolledCount / room.capacity) * 100) : 0;
  const isOver = enrolledCount > room.capacity;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/classrooms')}
              className="text-outline hover:text-primary text-xs font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Classrooms</span>
            </button>
            <span className="text-outline-variant">/</span>
            <span className="text-xs text-primary font-semibold uppercase tracking-wider">
              Room Overview
            </span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            {room.name}
          </h1>
          <p className="text-xs text-outline font-mono">
            Room ID: {room.id}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/enrollment"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs no-underline transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">assignment</span>
            <span>Enrollment Pipeline</span>
          </Link>
          <button
            type="button"
            onClick={handleOpenDelete}
            className="px-3.5 py-2 rounded-lg bg-error-container/40 text-on-error-container hover:bg-error-container text-xs font-semibold transition-colors cursor-pointer"
          >
            Delete Room
          </button>
        </div>
      </div>

      {/* Main Grid: Occupancy & Assigned Staff (Left), Enrolled Children (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Capacity Card */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-low flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
              <span className="text-xs text-outline uppercase tracking-wider font-semibold">
                Occupancy Gauge
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                isOver ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isOver ? 'Over Capacity' : 'Within Limits'}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface">
                {enrolledCount}
              </span>
              <span className="text-lg text-outline">/ {room.capacity}</span>
              <span className="font-mono font-bold text-secondary ml-auto text-sm">
                {occupancyPercentage}% Full
              </span>
            </div>

            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOver ? 'bg-red-500' : occupancyPercentage >= 85 ? 'bg-amber-500' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
              />
            </div>

            <div className="pt-2 text-xs text-outline flex items-center justify-between border-t border-surface-container-low">
              <span>Licensed Capacity Slots</span>
              <span className="font-mono font-semibold text-on-surface">{room.capacity} Max</span>
            </div>
          </div>

          {/* Assigned Staff & Educators Card (Section 4.7) */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-surface-container-low flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
              <span className="text-xs text-outline uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">school</span>
                Assigned Staff ({assignedStaff.length})
              </span>
            </div>

            {assignError && (
              <div className="p-2 rounded-lg bg-error-container/30 border border-error/20 text-error text-[11px] font-semibold">
                {assignError}
              </div>
            )}

            {/* List of assigned educators */}
            <div className="space-y-2">
              {assignedStaff.length === 0 ? (
                <p className="text-xs text-outline py-2">
                  No staff members currently assigned to this classroom.
                </p>
              ) : (
                assignedStaff.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-2.5 rounded-lg bg-surface-container-low flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px]">
                        {assignment.staffName ? assignment.staffName[0] : 'S'}
                      </div>
                      <div>
                        <span className="font-bold text-on-surface block">{assignment.staffName}</span>
                        <span className="text-[10px] text-outline">
                          Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStaff(assignment.id)}
                      className="text-outline hover:text-error p-1 rounded transition-colors cursor-pointer"
                      title="Unassign educator"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Assign Staff Inline Form */}
            {availableStaff.length > 0 && (
              <form onSubmit={handleAssignStaff} className="pt-2 border-t border-surface-container-low flex gap-2">
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="flex-1 h-8 px-2 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                >
                  {availableStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.role})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={staffLoading || !selectedStaffId}
                  className="px-3 h-8 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  Assign
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Area: Enrolled Children Roster (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-low overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-surface-container-low flex items-center justify-between border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">child_care</span>
                <span className="text-xs font-bold text-on-surface">
                  Assigned Children Roster ({enrollments.length})
                </span>
              </div>
              <span className="font-mono text-xs text-outline">
                {Math.max(0, room.capacity - enrolledCount)} open slots remaining
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-lowest text-outline font-semibold uppercase tracking-wider border-b border-surface-container-low text-[11px]">
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Enrollment Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-outline text-xs">
                        No students currently enrolled in this room cohort.
                      </td>
                    </tr>
                  ) : (
                    enrollments.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b border-surface-container-low/60 hover:bg-surface-container-low/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-on-surface">
                          <Link
                            to={`/children/${e.childId}`}
                            className="text-on-surface hover:text-primary transition-colors no-underline flex items-center gap-2"
                          >
                            <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-[11px]">
                              {e.childName ? e.childName[0] : 'C'}
                            </div>
                            <span>{e.childName}</span>
                          </Link>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {e.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono text-outline">
                          {new Date(e.enrollmentDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/children/${e.childId}`}
                            className="px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-[11px] no-underline"
                          >
                            Profile
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Safe Delete Classroom Modal with Dependents Guard */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title={`Delete ${room.name}?`}
          subtitle="Verifying student enrollments and staff room assignments"
          maxWidth="sm"
        >
          <div className="space-y-4">
            {isLoadingDependents ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-outline">
                <span className="material-symbols-outlined text-[24px] animate-spin">progress_activity</span>
                <span className="text-xs">Checking classroom dependencies...</span>
              </div>
            ) : deleteDependents && deleteDependents.activeEnrollments > 0 ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-100">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">block</span>
                    <span>Cannot Delete Classroom</span>
                  </div>
                  <p className="text-[12px] text-amber-800 dark:text-amber-300 mt-1.5 leading-relaxed">
                    This room currently has <strong>{deleteDependents.activeEnrollments} actively enrolled student(s)</strong>.
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2 bg-white/60 dark:bg-slate-900/40 p-2 rounded">
                    Deleting a classroom with active student cohorts is blocked. Please reassign or graduate students in the Enrollment Pipeline before deleting this room.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setShowDeleteModal(false);
                      navigate('/enrollment');
                    }}
                    icon="assignment"
                  >
                    Open Enrollment Pipeline
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {deleteDependents && deleteDependents.activeStaff > 0 ? (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                    Notice: <strong>{deleteDependents.activeStaff} staff member(s)</strong> are currently assigned to this room. Deleting will automatically clear those classroom assignments.
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    No active students are enrolled in {room.name}. Permanent deletion is safe to proceed.
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleConfirmDelete}
                    isLoading={isDeleting}
                  >
                    Permanently Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
