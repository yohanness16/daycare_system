import React from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useChildren } from '../../children/useChildren';
import { useAttendance } from '../useAttendance';

export const ChildAttendancePage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const { getChildById } = useChildren();
  const { getChildAttendance, fetchChildAttendance } = useAttendance();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (childId) {
      fetchChildAttendance(childId);
    }
  }, [childId, fetchChildAttendance]);

  if (!childId) {
    return <Navigate to="/attendance" replace />;
  }

  const child = getChildById(childId);
  if (!child) {
    return <Navigate to="/children" replace />;
  }

  const history = getChildAttendance(childId);

  return (
    <div className="flex flex-col gap-space-lg w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/children/${child.id}`)}
              className="text-outline hover:text-primary font-label-sm uppercase tracking-wider flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Profile</span>
            </button>
            <span className="text-outline-variant">/</span>
            <span className="font-label-sm text-primary font-semibold uppercase tracking-wider">
              Attendance History
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            Attendance Ledger: {child.firstName} {child.lastName}
          </h1>
          <p className="font-body-md text-on-surface-variant">
            Full chronological check-in and checkout history, verified timestamps, and recorded staff members.
          </p>
        </div>

        <Link
          to="/attendance"
          className="inline-flex items-center gap-2 px-space-md py-2.5 rounded-lg bg-surface-container-lowest text-on-surface shadow-xs hover:bg-surface-container-low font-label-md text-label-md border border-surface-container-high no-underline"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">fact_check</span>
          <span>Daily Roll Call</span>
        </Link>
      </div>

      {/* History Ledger Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-surface-container-low overflow-hidden flex flex-col">
        <div className="px-space-md py-3.5 bg-surface-container-low flex items-center justify-between border-b border-surface-container">
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Recorded Sessions ({history.length})
          </span>
          <span className="font-mono-data text-label-sm text-outline">
            Child ID: {child.id.substring(0, 8)}...
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-surface-container-lowest text-outline font-label-sm uppercase tracking-wider border-b border-surface-container-low">
                <th className="px-space-md py-3">Date</th>
                <th className="px-space-sm py-3">Arrival Time</th>
                <th className="px-space-sm py-3">Departure Time</th>
                <th className="px-space-sm py-3">Receiving Staff</th>
                <th className="px-space-md py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-space-md py-8 text-center text-outline font-body-md">
                    No attendance records logged for {child.firstName} yet.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="border-b border-surface-container-low/60 hover:bg-surface-container-low/30">
                    <td className="px-space-md py-3 font-semibold text-on-surface font-mono-data">
                      {h.date}
                    </td>
                    <td className="px-space-sm py-3 font-mono-data text-emerald-700">
                      {h.arrivalTime ? new Date(h.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-space-sm py-3 font-mono-data text-outline">
                      {h.departureTime ? new Date(h.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In attendance'}
                    </td>
                    <td className="px-space-sm py-3 text-on-surface-variant font-medium">
                      {h.recordedByName || 'Staff Member'}
                    </td>
                    <td className="px-space-md py-3 text-outline">
                      {h.note || 'Regular daily session'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
