/**
 * ProtectedRoute Component
 * Route guard that redirects unauthenticated users to login
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../atoms';
import LoginPage from '../../pages/auth/Login';

interface IProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'admin';
}

const ProtectedRoute: React.FC<IProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-smoke">
        <div className="flex flex-col items-center space-y-4">
          <Icon name="spinner" size={40} className="text-teal-primary" />
          <p className="text-slate">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Check role requirement if specified
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-smoke">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <Icon name="warning" size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-teal-deep mb-2">Access Denied</h2>
          <p className="text-slate">
            You don't have permission to access this page. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
