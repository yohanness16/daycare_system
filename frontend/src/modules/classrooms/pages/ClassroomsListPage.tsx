import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { Button, CapacityBar, Modal, StatCard } from '../../../components/ui';
import { useClassrooms } from '../useClassrooms';
import { classroomsApi, type ClassroomDependentsResponse } from '../classroomsApi';
import type { Classroom } from '../types';

export const ClassroomsListPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { classrooms, totalCount, createClassroom, deleteClassroom, isLoading } = useClassrooms();

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(15);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Safe delete classroom state
  const [deleteTarget, setDeleteTarget] = useState<Classroom | null>(null);
  const [deleteDependents, setDeleteDependents] = useState<ClassroomDependentsResponse | null>(null);
  const [isLoadingDependents, setIsLoadingDependents] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenDelete = async (room: Classroom) => {
    setDeleteTarget(room);
    setDeleteDependents(null);
    setIsLoadingDependents(true);
    try {
      const deps = await classroomsApi.getDependents(room.id);
      setDeleteDependents(deps);
    } catch (err) {
      console.warn('Failed to load classroom dependents:', err);
      setDeleteDependents({ activeEnrollments: 0, activeStaff: 0 });
    } finally {
      setIsLoadingDependents(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteClassroom(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete classroom');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || capacity <= 0) return;

    try {
      setIsCreating(true);
      await createClassroom({ name: name.trim(), capacity: Number(capacity) });
      setName('');
      setCapacity(15);
      setShowAddModal(false);
    } finally {
      setIsCreating(false);
    }
  };

  const totalCapacitySum = classrooms.reduce((acc, c) => acc + c.capacity, 0);
  const totalEnrolledSum = classrooms.reduce((acc, c) => acc + (c.currentEnrollmentCount || 0), 0);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Classrooms &amp; Environments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Capacity tracking, ratio management, and room configurations
          </p>
        </div>

        {isAdmin && (
          <Button
            type="button"
            variant="primary"
            size="md"
            icon="add"
            onClick={() => setShowAddModal(true)}
          >
            Create Classroom
          </Button>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Classrooms"
          value={totalCount}
          icon="meeting_room"
          variant="primary"
          trend="Managed physical rooms"
        />
        <StatCard
          label="Facility Capacity"
          value={totalCapacitySum}
          icon="groups"
          variant="info"
          trend="Total licensed spaces"
        />
        <StatCard
          label="Total Enrolled"
          value={totalEnrolledSum}
          icon="badge"
          variant="success"
          trend={`${totalCapacitySum > 0 ? Math.round((totalEnrolledSum / totalCapacitySum) * 100) : 0}% total facility occupancy`}
        />
      </div>

      {/* Classrooms Grid with CapacityMeter per Spec §8.12 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 animate-pulse"
            />
          ))}
        </div>
      ) : classrooms.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No classrooms configured yet</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((room) => {
            const currentEnrolled = room.currentEnrollmentCount || 0;

            return (
              <div
                key={room.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-primary-500/30 transition-all flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Link
                      to={`/classrooms/${room.id}`}
                      className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-primary-600 no-underline transition-colors leading-snug"
                    >
                      {room.name}
                    </Link>
                  </div>

                  {/* Capacity Bar Component per spec §8.12 */}
                  <div className="mt-2">
                    <CapacityBar
                      current={currentEnrolled}
                      capacity={room.capacity}
                      label="Capacity:"
                    />
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Max: <strong className="text-slate-800 dark:text-slate-200">{room.capacity} students</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(room)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Classroom"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                    <Link
                      to={`/classrooms/${room.id}`}
                      className="px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 text-xs font-bold no-underline hover:bg-primary-100 transition-colors"
                    >
                      View Room &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Classroom Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New Classroom"
        subtitle="Specify room name and maximum capacity license limit"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Classroom Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Toddler Sunshine Room"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Maximum Student Capacity
            </label>
            <input
              type="number"
              min="1"
              max="50"
              required
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Setting capacity prevents over-enrollment above state-mandated ratios.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isCreating}
            >
              Create Room
            </Button>
          </div>
        </form>
      </Modal>

      {/* Safe Delete Classroom Modal with Dependents Guard */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Delete ${deleteTarget.name}?`}
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
                    onClick={() => setDeleteTarget(null)}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setDeleteTarget(null);
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
                    No active students are enrolled in {deleteTarget.name}. Permanent deletion is safe to proceed.
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(null)}
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
