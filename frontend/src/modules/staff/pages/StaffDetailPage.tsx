import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthContext';
import { CredentialsDialog, PhotoUploadAvatar } from '../../../components/ui';
import { useStaff } from '../useStaff';

export const StaffDetailPage: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const {
    getStaffById,
    deleteStaff,
    deactivateStaff,
    reactivateStaff,
    resetStaffPassword,
    updatePhoto,
  } = useStaff();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    defaultPassword: string;
  } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!staffId) {
    return <Navigate to="/staff" replace />;
  }

  const staffMember = getStaffById(staffId);
  if (!staffMember) {
    return <Navigate to="/staff" replace />;
  }

  const isActive = staffMember.isActive !== false;

  const handleResetPassword = async () => {
    if (!window.confirm(`Reset temporary password for ${staffMember.firstName} ${staffMember.lastName}?`)) return;
    try {
      setIsActionLoading(true);
      const res = await resetStaffPassword(staffMember.id);
      setCreatedCredentials({
        name: `${staffMember.firstName} ${staffMember.lastName}`,
        email: staffMember.email,
        defaultPassword: res.temporaryPassword,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleActive = async () => {
    const action = isActive ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${action} ${staffMember.firstName} ${staffMember.lastName}?`)) return;
    try {
      setIsActionLoading(true);
      if (isActive) {
        await deactivateStaff(staffMember.id);
      } else {
        await reactivateStaff(staffMember.id);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${action} staff.`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently remove staff record for ${staffMember.firstName} ${staffMember.lastName}?`)) return;
    try {
      setIsActionLoading(true);
      await deleteStaff(staffMember.id);
      navigate('/staff', { replace: true });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete staff member.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-space-lg w-full">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/staff')}
              className="text-outline hover:text-primary font-label-sm uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Staff</span>
            </button>
            <span className="text-outline-variant">/</span>
            <span className="font-label-sm text-primary font-semibold uppercase tracking-wider">
              Personnel File
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            {staffMember.firstName} {staffMember.lastName}
          </h1>
          <p className="font-body-md text-on-surface-variant font-mono-data text-[12px]">
            Staff UID: {staffMember.id}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isActionLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Reset temporary password"
            >
              <span className="material-symbols-outlined text-[16px]">key</span>
              <span>Reset Password</span>
            </button>

            <button
              type="button"
              onClick={handleToggleActive}
              disabled={isActionLoading}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-label-md text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                isActive
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isActive ? 'person_off' : 'person_check'}
              </span>
              <span>{isActive ? 'Deactivate' : 'Reactivate'}</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isActionLoading}
              className="px-3 py-2 rounded-lg bg-error-container/40 text-on-error-container hover:bg-error-container font-label-md text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Remove Record
            </button>
          </div>
        )}
      </div>

      {/* Main Personnel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left Column: Personnel Credentials Card (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-surface-container-low flex flex-col gap-space-md">
            <div className="flex items-center gap-4 pb-space-sm border-b border-surface-container-low">
              <PhotoUploadAvatar
                currentPhotoUrl={staffMember.photoUrl}
                name={`${staffMember.firstName} ${staffMember.lastName}`}
                id={staffMember.id}
                size="md"
                editable={isAdmin}
                onPhotoUploaded={async (newUrl) => {
                  await updatePhoto(staffMember.id, newUrl);
                }}
              />
              <div className="flex flex-col">
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                  {staffMember.firstName} {staffMember.lastName}
                </h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-[11px] font-semibold">
                    {staffMember.role}
                  </span>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Inactive
                    </span>
                  )}
                  <span className="text-[12px] text-outline">
                    Since {new Date(staffMember.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-2">
              <div className="p-space-sm rounded-lg bg-surface-container-low">
                <span className="font-label-sm text-outline uppercase tracking-wider block">Phone Number</span>
                <span className="font-headline-sm text-on-surface font-semibold font-mono-data mt-0.5 block">
                  {staffMember.phone || '—'}
                </span>
              </div>

              <div className="p-space-sm rounded-lg bg-surface-container-low">
                <span className="font-label-sm text-outline uppercase tracking-wider block">Work Email</span>
                <span className="font-headline-sm text-on-surface font-semibold mt-0.5 block truncate">
                  {staffMember.email}
                </span>
              </div>

              <div className="p-space-sm rounded-lg bg-surface-container-low sm:col-span-2">
                <span className="font-label-sm text-outline uppercase tracking-wider block">Residential Address</span>
                <span className="font-body-md text-on-surface font-medium mt-0.5 block">
                  {staffMember.address || 'Address not recorded'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Licensing Clearance & Compliance (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-surface-container-low flex flex-col gap-space-md">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-container-low">
              <span className="material-symbols-outlined text-primary text-[22px]">verified_user</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Compliance &amp; Certifications
              </h3>
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                  <span className="font-medium text-[13px] text-on-surface">FBI Fingerprint Clearance</span>
                </div>
                <span className="text-emerald-700 font-semibold text-[11px]">Approved</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                  <span className="font-medium text-[13px] text-on-surface">Pediatric CPR / First Aid</span>
                </div>
                <span className="text-emerald-700 font-semibold text-[11px]">Current</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                  <span className="font-medium text-[13px] text-on-surface">USDA CACFP Food Handler</span>
                </div>
                <span className="text-emerald-700 font-semibold text-[11px]">Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Credentials Success Modal */}
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
