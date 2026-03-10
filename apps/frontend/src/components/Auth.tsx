import React, { useState, createContext, useContext, useEffect } from 'react'
import { useSchools } from '../hooks/useApi'
import { School } from '../api/client'
import aspgIcon from '../aspg-icon.svg'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

interface User {
  id: string | number
  email: string
  name: string
  role: 'student' | 'admin' | 'super_admin'
  matricNumber?: string
  program?: string
  department?: string
  studentId?: string
  year?: string
  schoolId?: string
  schoolName?: string
  schoolDomain?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: 'student' | 'admin') => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored session on mount
    const storedUser = localStorage.getItem('auth_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('auth_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string, role: 'student' | 'admin') => {
    // Call actual API
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    })

    if (response.ok) {
      const data = await response.json()
      const userData = data.data?.user || data.user
      const token = data.data?.token || data.token
      setUser(userData)
      localStorage.setItem('auth_user', JSON.stringify(userData))
      localStorage.setItem('auth_token', token)
    } else {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Login failed')
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-smoke flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-primary"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Login Component
export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'student' | 'admin'>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)
  const { login } = useAuth()

  // Use React Query hook for schools
  const { data: schoolsResponse, isLoading: loadingSchools } = useSchools()
  const schools: School[] = schoolsResponse?.schools || []

  // Set default selected school when schools are loaded
  useEffect(() => {
    if (schools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(schools[0].id)
    }
  }, [schools, selectedSchoolId])

  const selectedSchool: School | null =
    schools.find((s: School) => s.id === selectedSchoolId) || null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password, role)
    } catch (err) {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-deep via-ocean-deep to-teal-primary relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <img src={aspgIcon} alt="ASPG" className="w-24 h-24 mb-6" />
            <h1 className="text-4xl xl:text-5xl font-serif text-white leading-tight mb-4">
              AI Student
              <br />
              <span className="italic text-teal-bright">Policy</span> Guidance
            </h1>
            <p className="text-teal-mist text-lg max-w-md">
              Instant, accurate answers to your university policy questions powered by AI.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-8 h-8 rounded-full bg-teal-bright/20 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-teal-bright"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span>24/7 Policy Support</span>
            </div>
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-8 h-8 rounded-full bg-teal-bright/20 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-teal-bright"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span>Accurate & Up-to-date Information</span>
            </div>
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-8 h-8 rounded-full bg-teal-bright/20 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-teal-bright"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span>Source References Included</span>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-bright/10"></div>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5"></div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-smoke">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={aspgIcon} alt="ASPG" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="font-serif text-2xl text-teal-deep">
              AI Student <span className="italic text-teal-primary">Policy</span> Guidance
            </h1>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-teal-deep mb-2">Welcome back</h2>
            <p className="text-slate">Sign in to access your university's policy guidance system</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* School Selector */}
            <div className="mb-5">
              <label htmlFor="school" className="block text-sm font-medium text-teal-deep mb-2">
                University
              </label>
              {loadingSchools ? (
                <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-slate animate-pulse">
                  Loading...
                </div>
              ) : (
                <select
                  id="school"
                  value={selectedSchoolId || ''}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary bg-white text-teal-deep transition-all"
                >
                  {schools.map((school: School) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Role Toggle */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-teal-deep mb-2">Sign in as</label>
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    role === 'student'
                      ? 'bg-white text-teal-deep shadow-sm'
                      : 'text-slate hover:text-teal-deep'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    role === 'admin'
                      ? 'bg-white text-teal-deep shadow-sm'
                      : 'text-slate hover:text-teal-deep'
                  }`}
                >
                  Administrator
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center space-x-2">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-teal-deep mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`${role}@${selectedSchool?.domain || 'university.edu'}`}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-teal-deep mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-teal-primary border-gray-300 rounded focus:ring-teal-primary"
                  />
                  <span className="ml-2 text-slate">Remember me</span>
                </label>
                <a href="#" className="text-teal-primary hover:text-ocean-deep font-medium">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-teal-primary text-white rounded-xl font-medium hover:bg-ocean-deep focus:ring-4 focus:ring-teal-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-teal-mist/50 rounded-xl border border-teal-bright/30">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-teal-primary flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-sm">
                <div className="font-medium text-teal-deep mb-1">Demo Credentials</div>
                <div className="text-slate space-y-0.5">
                  <div>
                    <span className="font-medium">Student:</span> student@
                    {selectedSchool?.domain || 'university.edu'} / student123
                  </div>
                  <div>
                    <span className="font-medium">Admin:</span> admin@
                    {selectedSchool?.domain || 'university.edu'} / admin123
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate">
            <p>© 2026 {selectedSchool?.name || 'University'}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Protected Route Component
export const ProtectedRoute: React.FC<{
  children: React.ReactNode
  requireAdmin?: boolean
}> = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, user } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
          <p className="text-sm text-gray-500">
            Logged in as: <strong>{user?.email}</strong> ({user?.role})
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Header with User Menu
export const AuthHeader: React.FC = () => {
  const { user, logout, isAdmin } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  if (!user) return null

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <img src={aspgIcon} alt="ASPG" className="w-10 h-10" />
            <div>
              <h1 className="font-serif text-lg text-teal-deep">
                AI Student <span className="italic text-teal-primary">Policy</span> Guidance
              </h1>
              <p className="text-xs text-slate">{user?.schoolName || 'University System'}</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-teal-primary rounded-full flex items-center justify-center text-white font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20">
                  <div className="p-3 border-b">
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                    {user.matricNumber && (
                      <div className="text-xs text-gray-500 mt-1">{user.matricNumber}</div>
                    )}
                  </div>
                  <div className="py-1">
                    {isAdmin && (
                      <a
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        👨‍💼 Admin Dashboard
                      </a>
                    )}
                    <a
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      👤 Profile Settings
                    </a>
                    <a
                      href="/help"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ❓ Help & Support
                    </a>
                  </div>
                  <div className="border-t py-1">
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
