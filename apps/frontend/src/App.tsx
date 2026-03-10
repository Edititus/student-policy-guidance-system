import React from 'react'
import PolicyChatbot from './components/PolicyChatbot'
import AdminDashboard from './components/AdminDashboard'
import { AuthProvider, useAuth, ProtectedRoute, AuthHeader } from './components/Auth'

const AppContent: React.FC = () => {
  const { isAdmin } = useAuth()

  return (
    <div>
      <AuthHeader />
      {isAdmin ? <AdminDashboard /> : <PolicyChatbot />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}
