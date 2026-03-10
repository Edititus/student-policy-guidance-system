/**
 * AdminManagementPage — Super admin manages school admins
 * List admins grouped by school, Create Admin, Suspend Admin
 */

import React, { useState } from 'react';
import { Icon } from '../../components/atoms';
import { useAdmins, useCreateAdmin, useSuspendAdmin, useAdminSchools } from '../../hooks/useSuperAdmin';
import type { User, School } from '../../api/client';

interface CreateAdminForm {
  name: string;
  email: string;
  schoolId: string;
}

const AdminManagementPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAdminForm>({ name: '', email: '', schoolId: '' });
  const [createError, setCreateError] = useState('');
  const [createResult, setCreateResult] = useState<{ name: string; email: string; tempPassword: string } | null>(null);

  const { data: adminsData, isLoading: adminsLoading } = useAdmins();
  const { data: schoolsData } = useAdminSchools();
  const createMutation = useCreateAdmin();
  const suspendMutation = useSuspendAdmin();

  const admins: User[] = adminsData?.data || [];
  const schools: School[] = schoolsData?.data || [];

  // Group admins by school
  const adminsBySchool = admins.reduce<Record<string, User[]>>((acc, admin) => {
    const key = admin.schoolName || admin.schoolId || 'Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(admin);
    return acc;
  }, {});

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.name || !createForm.email || !createForm.schoolId) {
      setCreateError('All fields are required');
      return;
    }

    try {
      const result = await createMutation.mutateAsync(createForm);
      const data = result?.data;
      if (data) {
        setCreateResult({
          name: data.name,
          email: data.email,
          tempPassword: (data as unknown as { tempPassword: string }).tempPassword,
        });
      }
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', schoolId: '' });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create admin');
    }
  };

  const handleSuspend = (userId: number) => {
    if (confirm('Are you sure you want to suspend this admin?')) {
      suspendMutation.mutate(userId);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-teal-deep">Admin Management</h1>
          <p className="text-slate mt-1">Create and manage school administrators</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-teal-primary text-white rounded-xl hover:bg-ocean-deep transition-colors"
        >
          <Icon name="plus" size={18} />
          <span>Create Admin</span>
        </button>
      </div>

      {adminsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Icon name="spinner" size={24} className="text-teal-primary" />
          <span className="ml-3 text-slate">Loading admins...</span>
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <Icon name="user" size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-slate">No admins found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(adminsBySchool).map(([schoolName, schoolAdmins]) => (
            <div key={schoolName} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-teal-deep">{schoolName}</h3>
                <p className="text-xs text-slate">{schoolAdmins.length} admin{schoolAdmins.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {schoolAdmins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <div className="font-medium text-teal-deep">{admin.name}</div>
                      <div className="text-sm text-slate">{admin.email}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        admin.status === 'active' ? 'bg-green-100 text-green-700' :
                        admin.status === 'suspended' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {admin.status ? admin.status.charAt(0).toUpperCase() + admin.status.slice(1) : 'Active'}
                      </span>
                      {admin.status !== 'suspended' && (
                        <button
                          onClick={() => handleSuspend(admin.id as number)}
                          disabled={suspendMutation.isPending}
                          className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Result Modal */}
      {createResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-teal-deep mb-3">Admin Created</h3>
            <p className="text-slate mb-2">
              <strong>{createResult.name}</strong> ({createResult.email})
            </p>
            <p className="text-sm text-slate mb-3">Temporary password:</p>
            <div className="bg-gray-100 rounded-xl p-4 font-mono text-center text-lg select-all mb-4">
              {createResult.tempPassword}
            </div>
            <p className="text-xs text-slate mb-4">
              Share this password securely. The admin should change it on first login.
            </p>
            <button
              onClick={() => setCreateResult(null)}
              className="w-full py-2.5 bg-teal-primary text-white rounded-xl hover:bg-ocean-deep transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-teal-deep">Create Admin</h3>
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-teal-deep mb-1">Full Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary"
                  placeholder="Admin name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-teal-deep mb-1">Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary"
                  placeholder="admin@university.edu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-teal-deep mb-1">School *</label>
                <select
                  value={createForm.schoolId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, schoolId: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-primary bg-white"
                >
                  <option value="">Select school...</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                  className="flex-1 py-2.5 border border-gray-200 text-slate rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 py-2.5 bg-teal-primary text-white rounded-xl hover:bg-ocean-deep transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagementPage;
