import React from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useChildren } from '../../children/useChildren';
import { useGuardians } from '../useGuardians';
import { PhotoUploadAvatar } from '../../../components/ui';

export const GuardianDetailPage: React.FC = () => {
  const { guardianId } = useParams<{ guardianId: string }>();
  const { getGuardianById, deleteGuardian, updatePhoto } = useGuardians();
  const { children } = useChildren();
  const navigate = useNavigate();

  if (!guardianId) {
    return <Navigate to="/guardians" replace />;
  }

  const guardian = getGuardianById(guardianId);
  if (!guardian) {
    return <Navigate to="/guardians" replace />;
  }

  const linkedChildren = children.filter((c) => c.guardianId === guardian.id);

  return (
    <div className="flex flex-col gap-space-lg w-full">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/guardians')}
              className="text-outline hover:text-primary font-label-sm uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Guardians</span>
            </button>
            <span className="text-outline-variant">/</span>
            <span className="font-label-sm text-primary font-semibold uppercase tracking-wider">
              Guardian File
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            {guardian.firstName} {guardian.lastName}
          </h1>
          <p className="font-body-md text-on-surface-variant font-mono-data text-[12px]">
            Master Guardian ID: {guardian.id}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Permanently remove ${guardian.firstName} ${guardian.lastName}?`)) {
              deleteGuardian(guardian.id);
              navigate('/guardians', { replace: true });
            }
          }}
          className="px-space-md py-2.5 rounded-lg bg-error-container/40 text-on-error-container hover:bg-error-container font-label-md font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          Delete Guardian Record
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left Card: Contact & Demographic Record (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-surface-container-low flex flex-col gap-space-md">
            <div className="flex items-center gap-4 pb-space-sm border-b border-surface-container-low">
              <PhotoUploadAvatar
                currentPhotoUrl={guardian.photoUrl}
                name={`${guardian.firstName} ${guardian.lastName}`}
                id={guardian.id}
                size="md"
                editable={true}
                onPhotoUploaded={async (newUrl) => {
                  await updatePhoto(guardian.id, newUrl);
                }}
              />
              <div className="flex flex-col">
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">
                  {guardian.firstName} {guardian.lastName}
                </h2>
                <span className="inline-flex items-center gap-1 text-[12px] text-emerald-700 font-semibold">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Primary Custody Contact (Clearance Valid)</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-2">
              <div className="p-space-sm rounded-lg bg-surface-container-low">
                <span className="font-label-sm text-outline uppercase tracking-wider block">Phone Number</span>
                <span className="font-headline-sm text-on-surface font-semibold font-mono-data mt-0.5 block">
                  {guardian.phone}
                </span>
              </div>

              <div className="p-space-sm rounded-lg bg-surface-container-low">
                <span className="font-label-sm text-outline uppercase tracking-wider block">Email Address</span>
                <span className="font-headline-sm text-on-surface font-semibold mt-0.5 block truncate">
                  {guardian.email || 'No email registered'}
                </span>
              </div>

              <div className="p-space-sm rounded-lg bg-surface-container-low sm:col-span-2">
                <span className="font-label-sm text-outline uppercase tracking-wider block">Residential Address</span>
                <span className="font-body-md text-on-surface font-medium mt-0.5 block">
                  {guardian.address || 'Address not recorded'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Associated Children (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-surface-container-low flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">child_care</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Enrolled Dependents ({linkedChildren.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/children/new')}
                className="text-primary hover:text-primary-container text-[12px] font-semibold"
              >
                + Register Child
              </button>
            </div>

            {linkedChildren.length === 0 ? (
              <div className="p-6 text-center text-outline font-body-md text-[13px]">
                No children currently assigned to this guardian.
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {linkedChildren.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-[12px]">
                        {c.firstName[0]}
                      </div>
                      <div>
                        <Link
                          to={`/children/${c.id}`}
                          className="font-semibold text-on-surface hover:text-primary transition-colors no-underline block text-[14px]"
                        >
                          {c.firstName} {c.lastName}
                        </Link>
                        <span className="text-[11px] text-outline font-mono-data">
                          DOB: {c.dateOfBirth}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/children/${c.id}`}
                      className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary font-semibold text-[11px] shadow-xs no-underline"
                    >
                      Profile
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
