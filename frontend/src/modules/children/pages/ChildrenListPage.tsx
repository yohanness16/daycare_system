import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { useLanguage } from '../../../core/i18n/LanguageContext';
import { formatAge } from '../../../core/utils/dateUtils';
import { Avatar, Badge, Button, Modal, SearchField, StatCard } from '../../../components/ui';
import { useChildren } from '../useChildren';
import { childrenApi, type ChildDependentsResponse } from '../childrenApi';
import type { Child } from '../types';
import { useClassrooms } from '../../classrooms/useClassrooms';
import { useEnrollment } from '../../enrollment/useEnrollment';

export const ChildrenListPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [genderFilter, setGenderFilter] = useState('all');
  const [selectedClassroomId, setSelectedClassroomId] = useState('all');

  const { children, totalCount, deleteChild, isLoading } = useChildren(search);
  const { classrooms } = useClassrooms();
  const { enrollments } = useEnrollment();

  // Child to delete state
  const [deleteTarget, setDeleteTarget] = useState<Child | null>(null);
  const [deleteDependents, setDeleteDependents] = useState<ChildDependentsResponse | null>(null);
  const [isLoadingDependents, setIsLoadingDependents] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenDelete = async (child: Child) => {
    setDeleteTarget(child);
    setDeleteDependents(null);
    setIsLoadingDependents(true);
    try {
      const deps = await childrenApi.getDependents(child.id);
      setDeleteDependents(deps);
    } catch (err) {
      console.warn('Failed to load child dependents:', err);
      setDeleteDependents({ enrollments: 0, attendances: 0, meals: 0, activities: 0 });
    } finally {
      setIsLoadingDependents(false);
    }
  };

  // Classroom lookup
  const childClassroomMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    enrollments.forEach((e) => {
      const isAct = e.status === 'Active';
      if (isAct && e.classroomId) {
        map.set(e.childId, {
          id: e.classroomId,
          name: e.classroomName || 'Enrolled Room',
        });
      }
    });
    return map;
  }, [enrollments]);

  // Filter children
  const filteredChildren = useMemo(() => {
    return children.filter((c) => {
      if (genderFilter !== 'all' && c.gender?.toLowerCase() !== genderFilter.toLowerCase()) {
        return false;
      }
      if (selectedClassroomId !== 'all') {
        const room = childClassroomMap.get(c.id);
        if (room?.id !== selectedClassroomId) return false;
      }
      return true;
    });
  }, [children, genderFilter, selectedClassroomId, childClassroomMap]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteChild(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete child');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header & Primary Actions per spec §8.7 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t('children', 'Children Directory')}
            </h1>
            <Badge variant="primary" label={`${totalCount} Total`} size="sm" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Student roster, age records, and primary guardian relationships
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          icon="person_add"
          onClick={() => navigate('/children/new')}
        >
          {t('registerChild', 'Register Child')}
        </Button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Registered"
          value={totalCount}
          icon="child_care"
          variant="primary"
          trend="Active children enrolled"
        />
        <StatCard
          label="Under 3 Years"
          value={
            children.filter((c) => {
              const age = formatAge(c.dateOfBirth);
              return age.includes('mo') || age.startsWith('1 yr') || age.startsWith('2 yr');
            }).length
          }
          icon="baby_changing_station"
          variant="info"
          trend="Infant & Toddler cohorts"
        />
        <StatCard
          label="Preschool & Pre-K"
          value={
            children.filter((c) => {
              const age = formatAge(c.dateOfBirth);
              return age.startsWith('3 yr') || age.startsWith('4 yr') || age.startsWith('5 yr');
            }).length
          }
          icon="school"
          variant="success"
          trend="Classroom ready learners"
        />
      </div>

      {/* FilterBar & View Mode Toggle Card per spec §8.7 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="w-full sm:w-64">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Search child or guardian..."
            />
          </div>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            value={selectedClassroomId}
            onChange={(e) => setSelectedClassroomId(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="all">All Classrooms</option>
            {classrooms.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cards vs Table View Toggle */}
        <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white font-bold shadow-2xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-white font-bold shadow-2xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">table_rows</span>
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Children List Render (Cards or Table) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 animate-pulse"
            />
          ))}
        </div>
      ) : filteredChildren.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <span className="material-symbols-outlined text-[24px]">child_care</span>
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No children found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try adjusting your search criteria or register a new child
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards View per Spec §8.7 */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredChildren.map((child) => {
            const ageFormatted = formatAge(child.dateOfBirth);
            const classroomName = childClassroomMap.get(child.id)?.name || 'Not enrolled';

            return (
              <div
                key={child.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-primary-500/30 transition-all p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={`${child.firstName} ${child.lastName}`}
                        id={child.id}
                        photoUrl={child.photoUrl}
                        size="md"
                      />
                      <div>
                        <Link
                          to={`/children/${child.id}`}
                          className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-primary-600 no-underline transition-colors block"
                        >
                          {child.firstName} {child.lastName}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {ageFormatted} • {child.gender || 'Child'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Room & Guardian details */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Classroom:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {classroomName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Guardian:</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[130px]">
                        {child.guardianName || 'Guardian Link'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to={`/children/${child.id}`}
                    className="flex-1 text-center py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 no-underline transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    to={`/children/${child.id}/history`}
                    className="flex-1 text-center py-2 rounded-xl bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 text-xs font-bold text-primary-600 dark:text-primary-300 no-underline transition-colors"
                  >
                    Timeline
                  </Link>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(child)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete student (Admin only)"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View per Spec §8.7 */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Age</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">Primary Guardian</th>
                  <th className="py-3 px-4">Classroom</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredChildren.map((child) => (
                  <tr key={child.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <Link
                        to={`/children/${child.id}`}
                        className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-slate-100 hover:text-primary-600 no-underline"
                      >
                        <Avatar
                          name={`${child.firstName} ${child.lastName}`}
                          id={child.id}
                          photoUrl={child.photoUrl}
                          size="xs"
                        />
                        <span>
                          {child.firstName} {child.lastName}
                        </span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {formatAge(child.dateOfBirth)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {child.gender || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                      {child.guardianName || 'Guardian Link'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {childClassroomMap.get(child.id)?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/children/${child.id}/history`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold no-underline hover:bg-slate-200"
                        >
                          Timeline
                        </Link>
                        <Link
                          to={`/children/${child.id}`}
                          className="px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 text-xs font-semibold no-underline hover:bg-primary-100"
                        >
                          Profile
                        </Link>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(child)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete child"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enhanced Delete Dialog with Dependents Audit per Sprint 1 P0 */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Delete ${deleteTarget.firstName} ${deleteTarget.lastName}?`}
          subtitle="Review dependent historical records that will be permanently removed"
          maxWidth="sm"
        >
          <div className="space-y-4">
            {isLoadingDependents ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-outline">
                <span className="material-symbols-outlined text-[24px] animate-spin">progress_activity</span>
                <span className="text-xs">Checking student records...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200">
                  <div className="flex items-center gap-2 font-bold text-xs text-rose-800 dark:text-rose-300">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    <span>Cascade Purge Warning</span>
                  </div>
                  <p className="text-[12px] text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                    Deleting this child profile will permanently remove all associated activity and operations logs:
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-rose-200/80 dark:border-rose-800/60 text-xs">
                    <div className="p-2 rounded bg-white/70 dark:bg-slate-900/50">
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Enrollments:</span>
                      <strong className="text-sm font-bold text-slate-800 dark:text-slate-100">{deleteDependents?.enrollments ?? 0}</strong>
                    </div>
                    <div className="p-2 rounded bg-white/70 dark:bg-slate-900/50">
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Attendance Logs:</span>
                      <strong className="text-sm font-bold text-slate-800 dark:text-slate-100">{deleteDependents?.attendances ?? 0}</strong>
                    </div>
                    <div className="p-2 rounded bg-white/70 dark:bg-slate-900/50">
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Meal Logs:</span>
                      <strong className="text-sm font-bold text-slate-800 dark:text-slate-100">{deleteDependents?.meals ?? 0}</strong>
                    </div>
                    <div className="p-2 rounded bg-white/70 dark:bg-slate-900/50">
                      <span className="text-slate-500 text-[10px] uppercase font-semibold block">Daily Activities:</span>
                      <strong className="text-sm font-bold text-slate-800 dark:text-slate-100">{deleteDependents?.activities ?? 0}</strong>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  This action is irreversible. All attendance logs, CACFP meal records, and milestone entries for this child will be erased.
                </p>

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
                    onClick={handleDeleteConfirm}
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
