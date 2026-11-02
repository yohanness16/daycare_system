import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { useLanguage } from '../../../core/i18n/LanguageContext';
import { StaffRole } from '../../../core/types/enums';
import { CredentialsDialog, ConfirmDialog, Modal, Button } from '../../../components/ui';
import { staffApi } from '../staffApi';
import { useStaff } from '../useStaff';
import type { Staff, StaffDependentsResponse } from '../types';

export const StaffListPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    staff,
    rawStaff,
    deleteStaff,
    deactivateStaff,
    reactivateStaff,
    resetStaffPassword,
    getStaffDependents,
    refetch,
  } = useStaff(roleFilter, statusFilter);

  // Search filtering
  const displayStaff = useMemo(() => {
    if (!searchQuery.trim()) return staff;
    const q = searchQuery.toLowerCase();
    return staff.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone && s.phone.toLowerCase().includes(q))
    );
  }, [staff, searchQuery]);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<StaffRole>(StaffRole.Teacher);

  // Credentials Dialog State
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    defaultPassword: string;
  } | null>(null);

  // Action Dialog States
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<Staff | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState<Staff | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [reactivateTarget, setReactivateTarget] = useState<Staff | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);
  const [deleteDependents, setDeleteDependents] = useState<StaffDependentsResponse | null>(null);
  const [isLoadingDependents, setIsLoadingDependents] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setFormError('First name, last name, and email are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const newStaff = await staffApi.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || 'N/A',
        email: email.trim(),
        address: address.trim() || 'Local Facility',
        role,
      });

      const fallbackPass = `${firstName.trim().toLowerCase().replace(/\s+/g, '')}.${lastName.trim().toLowerCase().replace(/\s+/g, '')}`;
      const defaultPassword = newStaff.defaultPassword || fallbackPass;

      setCreatedCredentials({
        name: `${newStaff.firstName} ${newStaff.lastName}`,
        email: newStaff.email,
        defaultPassword,
      });

      await refetch();

      // Reset form
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setShowAddModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = async (s: Staff) => {
    setDeleteTarget(s);
    setDeleteDependents(null);
    setIsLoadingDependents(true);
    try {
      const deps = await getStaffDependents(s.id);
      setDeleteDependents(deps);
    } catch (err) {
      console.warn('Failed to load dependents for staff:', err);
      setDeleteDependents({ activeClassrooms: 0, attendanceRecords: 0, mealRecords: 0, activityRecords: 0 });
    } finally {
      setIsLoadingDependents(false);
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!resetTarget) return;
    try {
      setIsResetting(true);
      const res = await resetStaffPassword(resetTarget.id);
      setCreatedCredentials({
        name: `${resetTarget.firstName} ${resetTarget.lastName}`,
        email: resetTarget.email,
        defaultPassword: res.temporaryPassword,
      });
      setResetTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      setIsDeactivating(true);
      await deactivateStaff(deactivateTarget.id);
      setDeactivateTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate staff member.');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleConfirmReactivate = async () => {
    if (!reactivateTarget) return;
    try {
      setIsReactivating(true);
      await reactivateStaff(reactivateTarget.id);
      setReactivateTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reactivate staff member.');
    } finally {
      setIsReactivating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteStaff(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete staff member.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeactivateInstead = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deactivateStaff(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to deactivate staff member.');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeStaffCount = rawStaff.filter((s) => s.isActive !== false).length;
  const inactiveStaffCount = rawStaff.filter((s) => s.isActive === false).length;
  const educatorsCount = staff.filter(
    (s) => s.role === StaffRole.Teacher || s.role === StaffRole.Assistant || s.role === StaffRole.Caregiver
  ).length;

  const hasHistoricalDependents =
    deleteDependents &&
    (deleteDependents.mealRecords > 0 ||
      deleteDependents.attendanceRecords > 0 ||
      deleteDependents.activityRecords > 0 ||
      deleteDependents.activeClassrooms > 0);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">
            {t('staff', 'Staff')} Directory
          </h1>
          <p className="text-xs text-outline mt-0.5">
            Educators, caregivers, active credentials, and staff access profiles
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* 2 Clean Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Active Staff</span>
            <div className="text-xl font-bold text-on-surface mt-0.5">{activeStaffCount} Active</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">badge</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Classroom Educators</span>
            <div className="text-xl font-bold text-secondary mt-0.5">{educatorsCount} Teachers</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Deactivated Accounts</span>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-0.5">{inactiveStaffCount} Inactive</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">person_off</span>
          </div>
        </div>
      </div>

      {/* Staff Table Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-low overflow-hidden flex flex-col">
        {/* Status Filter & Search Bar */}
        <div className="p-3 border-b border-surface-container-low flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface-container-lowest">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Status Pills */}
            <div className="flex items-center p-0.5 rounded-lg bg-surface-container-low border border-surface-container">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All ({rawStaff.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Active ({activeStaffCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === 'inactive'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Inactive ({inactiveStaffCount})
              </button>
            </div>

            <span className="text-surface-container-high mx-1 hidden sm:inline">|</span>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer font-medium"
            >
              <option value="">All Roles</option>
              {Object.values(StaffRole).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">
              search
            </span>
            <input
              type="search"
              placeholder="Search staff by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
            />
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-container-low text-outline uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Address</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {displayStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-outline text-xs">
                    No staff members match the selected filters.
                  </td>
                </tr>
              ) : (
                displayStaff.map((s) => {
                  const isActive = s.isActive !== false;
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-surface-container-low/30 transition-colors ${
                        !isActive ? 'opacity-75 bg-slate-50/40 dark:bg-slate-900/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-on-surface">
                        <Link
                          to={`/staff/${s.id}`}
                          className="text-on-surface hover:text-primary no-underline flex items-center gap-2"
                        >
                          {s.photoUrl ? (
                            <img
                              src={s.photoUrl}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover shrink-0 border border-surface-container"
                            />
                          ) : (
                            <div
                              className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 ${
                                isActive
                                  ? 'bg-secondary/10 text-secondary'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              {s.firstName[0]}
                            </div>
                          )}
                          <span>
                            {s.firstName} {s.lastName}
                          </span>
                        </Link>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-surface-container text-primary font-semibold text-[11px]">
                          {s.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            title={s.deactivatedAt ? `Deactivated on ${new Date(s.deactivatedAt).toLocaleDateString()}` : 'Deactivated'}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-outline">{s.phone || '—'}</td>
                      <td className="py-2.5 px-3 text-on-surface-variant font-mono-data">{s.email}</td>
                      <td className="py-2.5 px-3 text-outline truncate max-w-xs">{s.address || '—'}</td>
                      <td className="py-2.5 px-3 text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-1">
                            {/* Reset Password */}
                            <button
                              type="button"
                              onClick={() => setResetTarget(s)}
                              className="p-1.5 rounded-lg text-outline hover:text-primary hover:bg-surface-container-low transition-colors cursor-pointer"
                              title="Reset Password (Admin)"
                            >
                              <span className="material-symbols-outlined text-[16px]">key</span>
                            </button>

                            {/* Deactivate / Reactivate */}
                            {isActive ? (
                              <button
                                type="button"
                                onClick={() => setDeactivateTarget(s)}
                                className="p-1.5 rounded-lg text-outline hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                                title="Deactivate Staff Member"
                              >
                                <span className="material-symbols-outlined text-[16px]">person_off</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setReactivateTarget(s)}
                                className="p-1.5 rounded-lg text-outline hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                                title="Reactivate Staff Member"
                              >
                                <span className="material-symbols-outlined text-[16px]">person_check</span>
                              </button>
                            )}

                            {/* Safe Delete with Dependents Check */}
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(s)}
                              className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Staff Member"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-5 shadow-xl border border-surface-container flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
              <h2 className="text-base font-bold text-on-surface">Add Staff Member</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jessica"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Miller"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. jessica@daycare.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as StaffRole)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container cursor-pointer"
                  >
                    {Object.values(StaffRole).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. (555) 345-6789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Home Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123 Main St"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                  />
                </div>
              </div>

              {/* Auto-Provision Account Note */}
              <div className="pt-2 border-t border-surface-container-low">
                <div className="p-3 rounded-lg bg-surface-container-low flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">key</span>
                  <div className="text-[12px] text-on-surface-variant leading-relaxed">
                    <span className="font-semibold text-on-surface block mb-0.5">Automatic Account Provisioning</span>
                    A login user account is automatically created for this staff member. Default temporary password will be <code className="bg-surface-container px-1 py-0.5 rounded font-mono text-[11px] font-semibold text-primary">{firstName ? firstName.toLowerCase().replace(/\s+/g, '') : 'firstname'}.{lastName ? lastName.toLowerCase().replace(/\s+/g, '') : 'lastname'}</code>. They will be prompted to set a permanent password upon first login.
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-low">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-xs text-on-primary font-semibold shadow-xs cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSubmitting && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                  <span>Save Staff Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Dialog */}
      {resetTarget && (
        <ConfirmDialog
          isOpen={!!resetTarget}
          onClose={() => setResetTarget(null)}
          onConfirm={handleConfirmResetPassword}
          title={`Reset Temporary Password?`}
          description={`Generate a new temporary password for ${resetTarget.firstName} ${resetTarget.lastName} (${resetTarget.email})? Their current password will be replaced and they must set a permanent password upon logging in.`}
          confirmLabel="Generate New Password"
          isDestructive={false}
          isLoading={isResetting}
        />
      )}

      {/* Deactivate Confirmation Dialog */}
      {deactivateTarget && (
        <ConfirmDialog
          isOpen={!!deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={handleConfirmDeactivate}
          title={`Deactivate ${deactivateTarget.firstName} ${deactivateTarget.lastName}?`}
          description={`Deactivating will end all classroom assignments and immediately revoke all login sessions. Their historical logs (attendances, meals, notes) will remain intact. You can reactivate this account at any time.`}
          confirmLabel="Deactivate Account"
          isDestructive={true}
          isLoading={isDeactivating}
        />
      )}

      {/* Reactivate Confirmation Dialog */}
      {reactivateTarget && (
        <ConfirmDialog
          isOpen={!!reactivateTarget}
          onClose={() => setReactivateTarget(null)}
          onConfirm={handleConfirmReactivate}
          title={`Reactivate ${reactivateTarget.firstName} ${reactivateTarget.lastName}?`}
          description={`Restore portal login access for this staff member? They will be able to sign in and be assigned to classrooms again.`}
          confirmLabel="Reactivate Account"
          isDestructive={false}
          isLoading={isReactivating}
        />
      )}

      {/* Safe Delete with Dependents Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Delete ${deleteTarget.firstName} ${deleteTarget.lastName}?`}
          subtitle="Verifying operational dependencies before permanent deletion"
          maxWidth="md"
        >
          <div className="space-y-4">
            {isLoadingDependents ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-outline">
                <span className="material-symbols-outlined text-[28px] animate-spin">progress_activity</span>
                <span className="text-xs">Inspecting database dependencies...</span>
              </div>
            ) : hasHistoricalDependents ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-900 dark:text-amber-100">
                    <span className="material-symbols-outlined text-[20px] text-amber-600">warning</span>
                    <span>Historical Operations History Detected</span>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                    This staff member has recorded operations data in the system. Permanently deleting this record will fail or orphan critical classroom records:
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-amber-200 dark:border-amber-800/60 text-xs">
                    <div className="p-2 rounded bg-white/60 dark:bg-slate-900/40">
                      <span className="text-outline text-[11px] block">Active Classrooms:</span>
                      <strong className="text-sm font-bold text-on-surface">{deleteDependents?.activeClassrooms ?? 0}</strong>
                    </div>
                    <div className="p-2 rounded bg-white/60 dark:bg-slate-900/40">
                      <span className="text-outline text-[11px] block">Attendance Logs:</span>
                      <strong className="text-sm font-bold text-on-surface">{deleteDependents?.attendanceRecords ?? 0}</strong>
                    </div>
                    <div className="p-2 rounded bg-white/60 dark:bg-slate-900/40">
                      <span className="text-outline text-[11px] block">Meal Logs:</span>
                      <strong className="text-sm font-bold text-on-surface">{deleteDependents?.mealRecords ?? 0}</strong>
                    </div>
                    <div className="p-2 rounded bg-white/60 dark:bg-slate-900/40">
                      <span className="text-outline text-[11px] block">Activity Notes:</span>
                      <strong className="text-sm font-bold text-on-surface">{deleteDependents?.activityRecords ?? 0}</strong>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Recommended action: <strong>Deactivate</strong> this account instead. Deactivating preserves historical data while locking portal access and unassigning active classrooms.
                </p>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-low">
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
                    variant="primary"
                    size="sm"
                    onClick={handleDeactivateInstead}
                    isLoading={isDeleting}
                    icon="person_off"
                  >
                    Deactivate Instead (Recommended)
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleConfirmDelete}
                    isLoading={isDeleting}
                  >
                    Force Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  No active operations history or classroom assignments were found for {deleteTarget.firstName} {deleteTarget.lastName}. Permanent deletion is safe to proceed.
                </p>
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-low">
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

      {/* Generated Credentials Success Modal per spec §8.14 */}
      {createdCredentials && (
        <CredentialsDialog
          isOpen={!!createdCredentials}
          onClose={() => setCreatedCredentials(null)}
          staffName={createdCredentials.name}
          email={createdCredentials.email}
          temporaryPassword={createdCredentials.defaultPassword}
        />
      )}
    </div>
  );
};
