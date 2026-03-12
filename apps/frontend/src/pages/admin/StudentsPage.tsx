/**
 * StudentsPage — Admin student management
 * Tabs: Pending | Active | Suspended | All
 * Actions: Approve, Reject, Suspend, Reset Password, Create Student
 */

import React, { useState } from 'react'
import { Icon } from '../../components/atoms'
import {
  usePendingStudents,
  useApproveStudent,
  useRejectStudent,
  useCreateStudent,
  useUpdateUserStatus,
  useResetPassword,
  useAdminUsers,
} from '../../hooks/useAdmin'

type StudentTab = 'pending' | 'active' | 'suspended' | 'all'

interface CreateStudentForm {
  name: string
  email: string
  password: string
  department: string
  studentId: string
  year: string
}

const StudentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudentTab>('pending')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [resetResult, setResetResult] = useState<{ name: string; tempPassword: string } | null>(
    null
  )
  const [createForm, setCreateForm] = useState<CreateStudentForm>({
    name: '',
    email: '',
    password: '',
    department: '',
    studentId: '',
    year: '',
  })
  const [createError, setCreateError] = useState('')

  const { data: pendingData, isLoading: pendingLoading } = usePendingStudents()
  const { data: allUsersData, isLoading: allLoading } = useAdminUsers({ role: 'student' })

  const approveMutation = useApproveStudent()
  const rejectMutation = useRejectStudent()
  const createMutation = useCreateStudent()
  const updateStatusMutation = useUpdateUserStatus()
  const resetPasswordMutation = useResetPassword()

  const pendingStudents = pendingData?.data || []
  const allStudents = allUsersData?.data || []
  const activeStudents = allStudents.filter((s) => s.status === 'active')
  const suspendedStudents = allStudents.filter((s) => s.status === 'suspended')

  const tabs: { id: StudentTab; label: string; count: number }[] = [
    { id: 'pending', label: 'Pending', count: pendingStudents.length },
    { id: 'active', label: 'Active', count: activeStudents.length },
    { id: 'suspended', label: 'Suspended', count: suspendedStudents.length },
    { id: 'all', label: 'All', count: allStudents.length },
  ]

  const handleApprove = (userId: number) => {
    approveMutation.mutate(userId)
  }

  const handleReject = (userId: number) => {
    rejectMutation.mutate(userId)
  }

  const handleSuspend = (userId: number) => {
    updateStatusMutation.mutate({ userId, status: 'suspended' })
  }

  const handleReactivate = (userId: number) => {
    updateStatusMutation.mutate({ userId, status: 'active' })
  }

  const handleResetPassword = async (userId: number) => {
    try {
      const result = await resetPasswordMutation.mutateAsync(userId)
      const data = result?.data
      if (data) {
        setResetResult({ name: data.name, tempPassword: data.tempPassword })
      }
    } catch {
      // error handled by mutation
    }
  }

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')

    if (!createForm.name || !createForm.email || !createForm.password) {
      setCreateError('Name, email, and password are required')
      return
    }

    try {
      await createMutation.mutateAsync({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        department: createForm.department || undefined,
        studentId: createForm.studentId || undefined,
        year: createForm.year || undefined,
      })
      setShowCreateModal(false)
      setCreateForm({ name: '', email: '', password: '', department: '', studentId: '', year: '' })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create student')
    }
  }

  const isLoading = pendingLoading || allLoading

  const getDisplayStudents = () => {
    switch (activeTab) {
      case 'pending':
        return pendingStudents
      case 'active':
        return activeStudents
      case 'suspended':
        return suspendedStudents
      case 'all':
        return allStudents
    }
  }

  const displayStudents = getDisplayStudents()

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-teal-deep">Student Management</h1>
          <p className="text-slate mt-1 text-sm">Manage student registrations and accounts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-teal-primary text-white rounded-xl hover:bg-ocean-deep transition-colors shrink-0"
        >
          <Icon name="plus" size={18} />
          <span>Create Student</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-teal-deep shadow-sm'
                : 'text-slate hover:text-teal-deep'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  tab.id === 'pending' && tab.count > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Student List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Icon name="spinner" size={24} className="text-teal-primary" />
          <span className="ml-3 text-slate">Loading students...</span>
        </div>
      ) : displayStudents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <Icon name="users" size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-slate">
            No {activeTab === 'all' ? '' : activeTab + ' '}students found
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: card layout (< md) */}
          <div className="md:hidden space-y-3">
            {displayStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-teal-deep truncate">{student.name}</div>
                    {student.department && (
                      <div className="text-xs text-slate mt-0.5">{student.department}</div>
                    )}
                    <div className="text-sm text-slate mt-1 truncate">{student.email}</div>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : student.status === 'pending_approval'
                          ? 'bg-amber-100 text-amber-700'
                          : student.status === 'suspended'
                            ? 'bg-red-100 text-red-700'
                            : student.status === 'rejected'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {student.status === 'pending_approval'
                      ? 'Pending'
                      : student.status
                        ? student.status.charAt(0).toUpperCase() + student.status.slice(1)
                        : 'Unknown'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate">
                  <span>{student.schoolName || student.schoolId || '—'}</span>
                  {student.createdAt && <span>· {formatDate(student.createdAt)}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {student.status === 'pending_approval' && (
                    <>
                      <button
                        onClick={() => handleApprove(student.id as number)}
                        disabled={approveMutation.isPending}
                        className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(student.id as number)}
                        disabled={rejectMutation.isPending}
                        className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {student.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleSuspend(student.id as number)}
                        disabled={updateStatusMutation.isPending}
                        className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                      >
                        Suspend
                      </button>
                      <button
                        onClick={() => handleResetPassword(student.id as number)}
                        disabled={resetPasswordMutation.isPending}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        Reset PW
                      </button>
                    </>
                  )}
                  {student.status === 'suspended' && (
                    <button
                      onClick={() => handleReactivate(student.id as number)}
                      disabled={updateStatusMutation.isPending}
                      className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tablet+: scrollable table (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-slate uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-slate uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-slate uppercase tracking-wider">
                      School
                    </th>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-slate uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-semibold text-slate uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-4 lg:px-6 py-3 text-xs font-semibold text-slate uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="font-medium text-teal-deep">{student.name}</div>
                        {student.department && (
                          <div className="text-xs text-slate mt-0.5">{student.department}</div>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-slate">{student.email}</td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-slate">
                        {student.schoolName || student.schoolId || '—'}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : student.status === 'pending_approval'
                                ? 'bg-amber-100 text-amber-700'
                                : student.status === 'suspended'
                                  ? 'bg-red-100 text-red-700'
                                  : student.status === 'rejected'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {student.status === 'pending_approval'
                            ? 'Pending'
                            : student.status
                              ? student.status.charAt(0).toUpperCase() + student.status.slice(1)
                              : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-slate">
                        {student.createdAt ? formatDate(student.createdAt) : '—'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {student.status === 'pending_approval' && (
                            <>
                              <button
                                onClick={() => handleApprove(student.id as number)}
                                disabled={approveMutation.isPending}
                                className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(student.id as number)}
                                disabled={rejectMutation.isPending}
                                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {student.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleSuspend(student.id as number)}
                                disabled={updateStatusMutation.isPending}
                                className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => handleResetPassword(student.id as number)}
                                disabled={resetPasswordMutation.isPending}
                                className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                              >
                                Reset PW
                              </button>
                            </>
                          )}
                          {student.status === 'suspended' && (
                            <button
                              onClick={() => handleReactivate(student.id as number)}
                              disabled={updateStatusMutation.isPending}
                              className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Reset Password Result Modal */}
      {resetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-teal-deep mb-3">Password Reset</h3>
            <p className="text-slate mb-4">
              Temporary password for <strong>{resetResult.name}</strong>:
            </p>
            <div className="bg-gray-100 rounded-xl p-4 font-mono text-center text-lg select-all mb-4">
              {resetResult.tempPassword}
            </div>
            <p className="text-xs text-slate mb-4">
              Please share this password securely with the student. They should change it after
              first login.
            </p>
            <button
              onClick={() => setResetResult(null)}
              className="w-full py-2.5 bg-teal-primary text-white rounded-xl hover:bg-ocean-deep transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Create Student Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-teal-deep">Create Student Account</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setCreateError('')
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-teal-deep mb-1">Full Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary"
                  placeholder="Student name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-teal-deep mb-1">Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary"
                  placeholder="student@university.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-teal-deep mb-1">Password *</label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary"
                  placeholder="Initial password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-teal-deep mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={createForm.department}
                    onChange={(e) => setCreateForm((p) => ({ ...p, department: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary"
                    placeholder="e.g. Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-teal-deep mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={createForm.studentId}
                    onChange={(e) => setCreateForm((p) => ({ ...p, studentId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary"
                    placeholder="e.g. VU/2024/001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-teal-deep mb-1">Year</label>
                <input
                  type="text"
                  value={createForm.year}
                  onChange={(e) => setCreateForm((p) => ({ ...p, year: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary focus:border-teal-primary"
                  placeholder="e.g. Year 3"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setCreateError('')
                  }}
                  className="flex-1 py-2.5 border border-gray-200 text-slate rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2.5 bg-teal-primary text-white rounded-xl hover:bg-ocean-deep transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentsPage
