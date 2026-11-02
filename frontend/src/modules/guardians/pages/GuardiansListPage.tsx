import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGuardians } from '../useGuardians';
import { guardiansApi, type GuardianDependentsResponse } from '../guardiansApi';
import type { Guardian } from '../types';
import { Modal, Button } from '../../../components/ui';

export const GuardiansListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const { guardians, totalCount, createGuardian, deleteGuardian } = useGuardians(search);

  const [deleteTarget, setDeleteTarget] = useState<Guardian | null>(null);
  const [deleteDependents, setDeleteDependents] = useState<GuardianDependentsResponse | null>(null);
  const [isLoadingDependents, setIsLoadingDependents] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenDelete = async (g: Guardian) => {
    setDeleteTarget(g);
    setDeleteDependents(null);
    setIsLoadingDependents(true);
    try {
      const deps = await guardiansApi.getDependents(g.id);
      setDeleteDependents(deps);
    } catch (err) {
      console.warn('Failed to load guardian dependents:', err);
      setDeleteDependents({ children: 0 });
    } finally {
      setIsLoadingDependents(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteGuardian(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete guardian');
    } finally {
      setIsDeleting(false);
    }
  };

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) return;
    createGuardian({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
    });
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-on-surface">
            Guardians
          </h1>
          <p className="text-xs text-outline mt-0.5">
            Parents, authorized emergency contacts, and linked wards
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          <span>Add Guardian</span>
        </button>
      </div>

      {/* 2 Clean Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Total Guardians</span>
            <div className="text-xl font-bold text-on-surface mt-0.5">{totalCount} Registered</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">family_restroom</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-3.5 border border-surface-container-low shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-outline font-semibold uppercase tracking-wider">Emergency Contacts</span>
            <div className="text-xl font-bold text-secondary mt-0.5">{totalCount} On File</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">phone_enabled</span>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-low overflow-hidden flex flex-col">
        {/* Search header bar */}
        <div className="p-3 border-b border-surface-container-low flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">search</span>
            <input
              type="search"
              placeholder="Search by guardian name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container"
            />
          </div>
          <span className="text-xs text-outline font-medium">
            Showing {guardians.length} of {totalCount} guardians
          </span>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-container-low text-outline uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-3">Guardian Name</th>
                <th className="py-2.5 px-3">Phone Number</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3">Home Address</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {guardians.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-outline text-xs">
                    No guardians matching the search criteria found.
                  </td>
                </tr>
              ) : (
                guardians.map((g) => (
                  <tr key={g.id} className="hover:bg-surface-container-low/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-on-surface">
                      <Link
                        to={`/guardians/${g.id}`}
                        className="text-on-surface hover:text-primary transition-colors no-underline flex items-center gap-2"
                      >
                        {g.photoUrl ? (
                          <img
                            src={g.photoUrl}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover shrink-0 border border-surface-container"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary font-bold text-[10px] flex items-center justify-center shrink-0">
                            {g.firstName[0]}
                          </div>
                        )}
                        <span>{g.firstName} {g.lastName}</span>
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-on-surface font-medium">
                      {g.phone || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-on-surface-variant font-mono-data">
                      {g.email || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-outline max-w-xs truncate" title={g.address}>
                      {g.address || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/guardians/${g.id}`}
                          className="px-2 py-1 rounded bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[11px] no-underline"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(g)}
                          className="text-outline hover:text-error text-xs cursor-pointer p-1"
                          title="Delete Guardian"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Guardian Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-5 shadow-xl border border-surface-container flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
              <h2 className="text-base font-bold text-on-surface">Add Guardian</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
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
                    placeholder="e.g. Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. john@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Home Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123 Elm Street"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-surface-container"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container-low">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface-variant hover:bg-surface-container cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-xs text-on-primary font-semibold cursor-pointer"
                >
                  Save Guardian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Delete Guardian Modal with Dependents Guard */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Delete ${deleteTarget.firstName} ${deleteTarget.lastName}?`}
          subtitle="Verifying dependent child registrations before removal"
          maxWidth="sm"
        >
          <div className="space-y-4">
            {isLoadingDependents ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-outline">
                <span className="material-symbols-outlined text-[24px] animate-spin">progress_activity</span>
                <span className="text-xs">Checking child relationships...</span>
              </div>
            ) : deleteDependents && deleteDependents.children > 0 ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-100">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">block</span>
                    <span>Cannot Delete Guardian</span>
                  </div>
                  <p className="text-[12px] text-amber-800 dark:text-amber-300 mt-1.5 leading-relaxed">
                    This guardian is currently linked to <strong>{deleteDependents.children} registered child(ren)</strong> in your center.
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2 bg-white/60 dark:bg-slate-900/40 p-2 rounded">
                    Deleting a guardian with active child relationships is blocked to protect student emergency contact records. Please update or reassign the children to another guardian before deleting this record.
                  </p>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setDeleteTarget(null)}
                  >
                    Understood / Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  No registered children are linked to {deleteTarget.firstName} {deleteTarget.lastName}. Permanent deletion of this contact record is safe.
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
