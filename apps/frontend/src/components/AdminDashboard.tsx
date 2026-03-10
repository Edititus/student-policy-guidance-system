import React, { useState } from 'react'
import {
  useAdminStats,
  useEscalatedQueries,
  usePolicies,
  useRespondToQuery,
  useUploadPolicy,
  useActivatePolicy,
  useAnalytics,
  useExportData,
  useRecentActivity,
} from '../hooks/useApi'
import aspgIcon from '../aspg-icon.svg'

interface EscalatedQuery {
  id: number
  queryId: string
  queryText: string
  studentId?: number
  studentName?: string
  aiAnswer: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  timestamp: string
  responded: boolean
}

interface Policy {
  id: number
  policyId: string
  title: string
  category: string
  active: boolean
  createdAt: string
  chunkCount?: number
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'queries' | 'policies' | 'analytics'>(
    'overview'
  )
  const [selectedQuery, setSelectedQuery] = useState<EscalatedQuery | null>(null)
  const [adminResponse, setAdminResponse] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // React Query hooks
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useAdminStats()
  const {
    data: queriesData,
    isLoading: queriesLoading,
    refetch: refetchQueries,
  } = useEscalatedQueries()
  const { data: policiesData, isLoading: policiesLoading, refetch: refetchPolicies } = usePolicies()
  const { data: analyticsData } = useAnalytics('week')
  const { data: activityData, isLoading: activityLoading } = useRecentActivity(10)

  const respondMutation = useRespondToQuery()
  const uploadMutation = useUploadPolicy()
  const activateMutation = useActivatePolicy()
  const exportMutation = useExportData()

  // Extract data from responses
  const stats = statsData?.data || {
    totalQueries: 0,
    averageConfidence: 0,
    escalationRate: 0,
    averageRating: 0,
    uniqueStudents: 0,
    totalPolicies: 0,
    totalUsers: 0,
  }
  const escalatedQueries: EscalatedQuery[] = (queriesData?.data || []) as EscalatedQuery[]
  const policies: Policy[] = (policiesData?.data || []) as Policy[]
  const analytics = analyticsData?.data
  const recentActivity = activityData?.data || []

  const loading = statsLoading || queriesLoading || policiesLoading || activityLoading

  const handleRefresh = () => {
    refetchStats()
    refetchQueries()
    refetchPolicies()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('institution', 'Veritas University Abuja')

    setUploadProgress(10)

    try {
      await uploadMutation.mutateAsync(formData)
      setUploadProgress(100)
      alert('Policy uploaded successfully!')
      setTimeout(() => setUploadProgress(0), 2000)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
      setUploadProgress(0)
    }
  }

  const handleRespondToQuery = async (queryId: string) => {
    if (!adminResponse.trim()) {
      alert('Please enter a response')
      return
    }

    try {
      await respondMutation.mutateAsync({ queryId, response: adminResponse })
      alert('Response sent successfully!')
      setSelectedQuery(null)
      setAdminResponse('')
    } catch (error) {
      console.error('Response error:', error)
      alert('Failed to send response')
    }
  }

  const handleActivatePolicy = async (policyId: number) => {
    try {
      await activateMutation.mutateAsync(policyId)
      alert('Policy activated successfully!')
    } catch (error) {
      console.error('Activation error:', error)
      alert('Failed to activate policy')
    }
  }

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync('queries')
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-smoke flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-primary mx-auto mb-4"></div>
          <p className="text-slate">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      id: 'queries',
      label: 'Escalations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      badge: escalatedQueries.length > 0 ? escalatedQueries.length : undefined,
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-smoke flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-teal-deep flex-shrink-0 transition-all duration-300`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <img src={aspgIcon} alt="ASPG" className="w-10 h-10" />
              {!sidebarCollapsed && (
                <div>
                  <div className="text-white font-semibold text-sm">AI Policy Guidance</div>
                  <div className="text-teal-bright text-xs">Admin Dashboard</div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-teal-primary text-white'
                    : 'text-teal-mist hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                {item.badge && (
                  <span
                    className={`${sidebarCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Collapse Toggle */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 text-teal-mist hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg
                className={`w-5 h-5 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-teal-deep">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'queries' && 'Escalated Queries'}
                {activeTab === 'policies' && 'Policy Management'}
                {activeTab === 'analytics' && 'Analytics & Reports'}
              </h1>
              <p className="text-sm text-slate mt-0.5">
                {activeTab === 'overview' && 'Monitor system performance and recent activity'}
                {activeTab === 'queries' && 'Review and respond to flagged queries'}
                {activeTab === 'policies' && 'Manage your policy knowledge base'}
                {activeTab === 'analytics' && 'Detailed insights and data export'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-teal-mist text-teal-deep rounded-lg hover:bg-teal-bright transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Refresh</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-teal-primary rounded-full flex items-center justify-center text-white font-medium text-sm">
                  A
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-teal-deep">Admin</div>
                  <div className="text-xs text-slate">admin@veritas.edu.ng</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-teal-mist rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-teal-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-teal-deep">{stats.totalQueries}</div>
                  <div className="text-sm text-slate">Total Queries</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-teal-deep">
                    {(stats.averageConfidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-slate">Avg Confidence</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-teal-deep">
                    {(stats.escalationRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate">Escalation Rate</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-teal-deep">
                    {stats.averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-slate">Avg Rating</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-ocean-deep/10 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-ocean-deep"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-teal-deep">{stats.uniqueStudents}</div>
                  <div className="text-sm text-slate">Active Students</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-teal-deep mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center justify-center p-5 border-2 border-dashed border-gray-200 rounded-xl hover:border-teal-primary hover:bg-teal-mist/30 cursor-pointer transition-all group">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileUpload}
                    />
                    <div className="text-center">
                      <div className="w-12 h-12 bg-teal-mist rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-primary transition-colors">
                        <svg
                          className="w-6 h-6 text-teal-primary group-hover:text-white transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                      </div>
                      <div className="text-sm font-medium text-teal-deep">Upload Policy</div>
                      <div className="text-xs text-slate mt-1">PDF, DOCX, TXT</div>
                    </div>
                  </label>
                  <button
                    onClick={() => setActiveTab('queries')}
                    className="p-5 border-2 border-gray-200 rounded-xl hover:border-teal-primary hover:bg-teal-mist/30 transition-all group"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3 relative">
                        <svg
                          className="w-6 h-6 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        {escalatedQueries.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {escalatedQueries.length}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-teal-deep">Review Escalations</div>
                      <div className="text-xs text-slate mt-1">
                        {escalatedQueries.length} pending
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="p-5 border-2 border-gray-200 rounded-xl hover:border-teal-primary hover:bg-teal-mist/30 transition-all group"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-ocean-deep/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <svg
                          className="w-6 h-6 text-ocean-deep"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <div className="text-sm font-medium text-teal-deep">View Reports</div>
                      <div className="text-xs text-slate mt-1">Export analytics</div>
                    </div>
                  </button>
                </div>
                {uploadProgress > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-slate mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-teal-deep mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-6 text-slate">
                      <svg
                        className="w-10 h-10 mx-auto mb-2 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm">No recent activity</p>
                    </div>
                  ) : (
                    recentActivity.map((activity, index) => {
                      const severityColors = {
                        success: 'bg-green-500',
                        warning: 'bg-amber-500',
                        info: 'bg-teal-primary',
                      }
                      const timeAgo = (timestamp: string) => {
                        const diff = Date.now() - new Date(timestamp).getTime()
                        const minutes = Math.floor(diff / 60000)
                        if (minutes < 1) return 'Just now'
                        if (minutes < 60) return `${minutes} min ago`
                        const hours = Math.floor(minutes / 60)
                        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
                        const days = Math.floor(hours / 24)
                        return `${days} day${days > 1 ? 's' : ''} ago`
                      }
                      return (
                        <div
                          key={index}
                          className="flex items-center space-x-4 p-3 hover:bg-smoke rounded-lg transition-colors"
                        >
                          <div
                            className={`w-2 h-2 ${severityColors[activity.severity]} rounded-full`}
                          ></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-teal-deep">
                              {activity.title}
                            </div>
                            <div className="text-xs text-slate">{activity.description}</div>
                          </div>
                          <div className="text-xs text-slate">{timeAgo(activity.timestamp)}</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Escalated Queries Tab */}
          {activeTab === 'queries' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-teal-deep">Escalated Queries</h2>
                  <p className="text-sm text-slate mt-1">
                    Queries flagged for admin review due to low confidence
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {escalatedQueries.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-green-500"
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
                      <div className="text-lg font-medium text-teal-deep">No escalated queries</div>
                      <div className="text-sm text-slate mt-1">
                        All queries are being handled with high confidence!
                      </div>
                    </div>
                  ) : (
                    escalatedQueries.map((query) => (
                      <div key={query.id} className="p-6 hover:bg-smoke transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span
                                className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                  query.confidence === 'LOW'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {query.confidence}
                              </span>
                              <span className="text-xs text-slate">
                                {new Date(query.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-teal-deep mb-3">
                              "{query.queryText}"
                            </div>
                            <div className="text-xs text-slate bg-smoke p-3 rounded-lg">
                              <div className="font-medium mb-1 text-teal-deep">AI's attempt:</div>
                              {query.aiAnswer}
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedQuery(query)}
                            className="ml-4 px-4 py-2 bg-teal-primary text-white rounded-lg hover:bg-ocean-deep transition-colors text-sm font-medium"
                          >
                            Respond
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Policies Tab */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-teal-deep">Policy Library</h2>
                    <p className="text-sm text-slate mt-1">
                      {policies.length} policies in knowledge base
                    </p>
                  </div>
                  <label className="px-4 py-2.5 bg-teal-primary text-white rounded-lg hover:bg-ocean-deep cursor-pointer transition-colors text-sm font-medium flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>Upload New Policy</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <div className="divide-y divide-gray-100">
                  {policies.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-teal-mist rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-8 h-8 text-teal-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div className="text-lg font-medium text-teal-deep">No policies yet</div>
                      <div className="text-sm text-slate mt-1">
                        Upload your first policy document to get started
                      </div>
                    </div>
                  ) : (
                    policies.map((policy) => (
                      <div key={policy.id} className="p-6 hover:bg-smoke transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-sm font-medium text-teal-deep">{policy.title}</h3>
                              <span
                                className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                  policy.active
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {policy.active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-slate">
                              <span className="flex items-center space-x-1">
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                  />
                                </svg>
                                <span>{policy.category}</span>
                              </span>
                              <span>{policy.chunkCount || 0} chunks</span>
                              <span>{new Date(policy.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {!policy.active && (
                            <button
                              onClick={() => handleActivatePolicy(policy.id)}
                              className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-teal-deep mb-6">Query Analytics</h2>
                <div className="space-y-8">
                  {/* Confidence Distribution */}
                  <div>
                    <h3 className="text-sm font-medium text-teal-deep mb-4">
                      Confidence Distribution
                    </h3>
                    {analytics?.confidenceDistribution ? (
                      (() => {
                        const dist = analytics.confidenceDistribution
                        const total = dist.HIGH + dist.MEDIUM + dist.LOW
                        const highPct = total > 0 ? Math.round((dist.HIGH / total) * 100) : 0
                        const medPct = total > 0 ? Math.round((dist.MEDIUM / total) * 100) : 0
                        const lowPct = total > 0 ? Math.round((dist.LOW / total) * 100) : 0
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <div className="w-24 text-sm text-slate">HIGH</div>
                              <div className="flex-1 bg-gray-100 rounded-full h-3">
                                <div
                                  className="bg-green-500 h-3 rounded-full"
                                  style={{ width: `${highPct}%` }}
                                ></div>
                              </div>
                              <div className="w-16 text-right text-sm font-medium text-teal-deep">
                                {highPct}%
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="w-24 text-sm text-slate">MEDIUM</div>
                              <div className="flex-1 bg-gray-100 rounded-full h-3">
                                <div
                                  className="bg-amber-500 h-3 rounded-full"
                                  style={{ width: `${medPct}%` }}
                                ></div>
                              </div>
                              <div className="w-16 text-right text-sm font-medium text-teal-deep">
                                {medPct}%
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="w-24 text-sm text-slate">LOW</div>
                              <div className="flex-1 bg-gray-100 rounded-full h-3">
                                <div
                                  className="bg-red-500 h-3 rounded-full"
                                  style={{ width: `${lowPct}%` }}
                                ></div>
                              </div>
                              <div className="w-16 text-right text-sm font-medium text-teal-deep">
                                {lowPct}%
                              </div>
                            </div>
                          </div>
                        )
                      })()
                    ) : (
                      <div className="text-center py-4 text-slate text-sm">
                        No analytics data available
                      </div>
                    )}
                  </div>

                  {/* Top Query Categories */}
                  <div>
                    <h3 className="text-sm font-medium text-teal-deep mb-4">
                      Top Query Categories
                    </h3>
                    {analytics?.queryCategories &&
                    Object.keys(analytics.queryCategories).length > 0 ? (
                      (() => {
                        const categories = Object.entries(analytics.queryCategories)
                        const total = categories.reduce((sum, [, count]) => sum + count, 0)
                        const categoryColors = [
                          {
                            bg: 'bg-teal-mist',
                            text: 'text-teal-deep',
                            subtext: 'text-teal-primary',
                          },
                          { bg: 'bg-green-50', text: 'text-green-700', subtext: 'text-green-600' },
                          {
                            bg: 'bg-purple-50',
                            text: 'text-purple-700',
                            subtext: 'text-purple-600',
                          },
                          {
                            bg: 'bg-orange-50',
                            text: 'text-orange-700',
                            subtext: 'text-orange-600',
                          },
                        ]
                        return (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {categories.slice(0, 4).map(([category, count], index) => {
                              const colors = categoryColors[index % categoryColors.length]
                              const pct = total > 0 ? Math.round((count / total) * 100) : 0
                              return (
                                <div key={category} className={`${colors.bg} p-4 rounded-xl`}>
                                  <div className={`text-2xl font-bold ${colors.text}`}>{pct}%</div>
                                  <div className={`text-sm ${colors.subtext}`}>{category}</div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()
                    ) : (
                      <div className="text-center py-4 text-slate text-sm">
                        No category data available
                      </div>
                    )}
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={handleExport}
                    disabled={exportMutation.isPending}
                    className="w-full px-4 py-3.5 bg-teal-primary text-white rounded-xl hover:bg-ocean-deep transition-colors font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>
                      {exportMutation.isPending ? 'Exporting...' : 'Export Full Report (CSV)'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Response Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-teal-deep/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-teal-deep">Respond to Query</h3>
              <button
                onClick={() => {
                  setSelectedQuery(null)
                  setAdminResponse('')
                }}
                className="p-2 hover:bg-smoke rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-slate"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-teal-deep block mb-2">
                  Student's Question
                </label>
                <div className="p-4 bg-smoke rounded-xl text-sm text-teal-deep">
                  {selectedQuery.queryText}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-teal-deep block mb-2">
                  AI's Attempted Answer
                </label>
                <div className="p-4 bg-red-50 rounded-xl text-sm text-teal-deep border border-red-100">
                  {selectedQuery.aiAnswer}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-teal-deep block mb-2">
                  Your Correct Answer
                </label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Provide the accurate answer to this query..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary resize-none transition-all"
                  rows={6}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedQuery(null)
                  setAdminResponse('')
                }}
                className="px-5 py-2.5 text-slate hover:bg-smoke rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRespondToQuery(selectedQuery.queryId)}
                className="px-5 py-2.5 bg-teal-primary text-white rounded-lg hover:bg-ocean-deep transition-colors font-medium"
              >
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
