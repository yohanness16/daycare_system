import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: string;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, allowedRoles }) => {
  const { isAuthenticated, isLoading, user, mustChangePassword, isParent } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-[32px] animate-spin text-primary-500">
            progress_activity
          </span>
          <span className="text-xs font-semibold">Validating session...</span>
        </div>
      </div>
    );
  }

  const isParentPath = location.pathname.startsWith('/parent');

  if (!isAuthenticated) {
    // Redirect unauthenticated requests to the unified login page, retaining source URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Forced password change guard
  if (mustChangePassword) {
    const changePassTarget = isParent ? '/parent/change-password' : '/change-password';
    if (location.pathname !== changePassTarget) {
      return <Navigate to={changePassTarget} replace />;
    }
  }

  // Isolation: Parent cannot access staff routes
  if (isParent && !isParentPath) {
    return <Navigate to="/parent" replace />;
  }

  // Isolation: Non-parent cannot access parent routes (except Admin preview)
  const isAdminUser = user?.role === 'Administrator' || user?.role === 'Admin';
  if (!isParent && !isAdminUser && isParentPath) {
    return <Navigate to="/today" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || '';
    if (!allowedRoles.includes(userRole) && userRole !== 'Administrator' && userRole !== 'Admin') {
      return <Navigate to={isParent ? '/parent' : '/dashboard'} replace />;
    }
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'Administrator' && user?.role !== 'Admin') {
    return <Navigate to={isParent ? '/parent' : '/dashboard'} replace />;
  }

  return children;
};
