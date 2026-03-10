/**
 * App Router Configuration
 * Centralized route definitions using React Router v7
 */

import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoginPage, RegisterPage, PlatformAdminLoginPage } from '../pages/auth'
import AdminDashboard from '../components/AdminDashboardRefactored'
import PolicyChatbot from '../components/PolicyChatbot'
import { Spinner } from '../components/atoms'
import { AuthHeader } from '../components/organisms'

// Lazy-load super admin dashboard (only needed for super_admin users)
const SuperAdminDashboard = lazy(() => import('../pages/superadmin/SuperAdminDashboard'))

// Protected Route Wrapper
const ProtectedRouteWrapper: React.FC = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-smoke">
        <Spinner size="xl" label="Loading..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// Auth Route Wrapper (redirects to dashboard if logged in)
const AuthRouteWrapper: React.FC = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-smoke">
        <Spinner size="xl" label="Loading..." />
      </div>
    )
  }

  if (user) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'super_admin') return <Navigate to="/platform" replace />
    if (user.role === 'admin') return <Navigate to="/admin/overview" replace />
    return <Navigate to="/chat" replace />
  }

  return <Outlet />
}

// Platform Auth Wrapper (for /platform-admin/login — redirects if already logged in as super_admin)
const PlatformAuthWrapper: React.FC = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-smoke">
        <Spinner size="xl" label="Loading..." />
      </div>
    )
  }

  if (user) {
    if (user.role === 'super_admin') return <Navigate to="/platform" replace />
    // Non-super_admin users get sent to their own dashboard
    if (user.role === 'admin') return <Navigate to="/admin/overview" replace />
    return <Navigate to="/chat" replace />
  }

  return <Outlet />
}

// Admin Route Wrapper (requires admin role)
const AdminRouteWrapper: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-smoke">
        <Spinner size="xl" label="Loading..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/chat" replace />
  }

  return <Outlet />
}

// Platform Route Wrapper (requires super_admin role — protects /platform/*)
const PlatformRouteWrapper: React.FC = () => {
  const { user, isSuperAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-smoke">
        <Spinner size="xl" label="Loading..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/platform-admin/login" replace />
  }

  if (!isSuperAdmin) {
    return <Navigate to={user.role === 'admin' ? '/admin/overview' : '/chat'} replace />
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-smoke">
          <Spinner size="xl" label="Loading..." />
        </div>
      }
    >
      <Outlet />
    </Suspense>
  )
}

// User Protected Layout (non-admin protected routes)
const ProtectedUserLayout: React.FC = () => {
  return (
    <>
      <AuthHeader />
      <Outlet />
    </>
  )
}

// Router configuration
export const router = createBrowserRouter([
  // Auth routes (accessible when not logged in)
  {
    element: <AuthRouteWrapper />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },
  // Platform admin login (separate auth flow)
  {
    element: <PlatformAuthWrapper />,
    children: [
      {
        path: '/platform-admin/login',
        element: <PlatformAdminLoginPage />,
      },
    ],
  },
  // Protected routes (require authentication)
  {
    element: <ProtectedRouteWrapper />,
    children: [
      {
        element: <ProtectedUserLayout />,
        children: [
          {
            path: '/chat',
            element: <PolicyChatbot />,
          },
        ],
      },
    ],
  },
  // Admin routes (require admin role)
  {
    element: <AdminRouteWrapper />,
    children: [
      {
        path: '/admin',
        element: <Navigate to="/admin/overview" replace />,
      },
      {
        path: '/admin/:tab',
        element: <AdminDashboard />,
      },
    ],
  },
  // Platform routes (require super_admin role — replaces /super-admin)
  {
    element: <PlatformRouteWrapper />,
    children: [
      {
        path: '/platform',
        element: <Navigate to="/platform/overview" replace />,
      },
      {
        path: '/platform/:tab',
        element: <SuperAdminDashboard />,
      },
    ],
  },
  // Root redirect
  {
    path: '/',
    element: <RootRedirect />,
  },
  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

// Root redirect component
function RootRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-smoke">
        <Spinner size="xl" label="Loading..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={user.role === 'super_admin' ? '/platform' : user.role === 'admin' ? '/admin/overview' : '/chat'} replace />
}

export default router
