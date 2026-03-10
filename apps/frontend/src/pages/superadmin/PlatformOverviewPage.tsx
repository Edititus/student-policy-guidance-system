/**
 * PlatformOverviewPage — Super admin platform stats
 * Shows total schools, admins, students, AI usage, pending registrations
 */

import React from 'react';
import { Icon } from '../../components/atoms';
import type { PlatformStats } from '../../api/client';

interface Props {
  stats: PlatformStats | null;
  isLoading: boolean;
}

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Icon>['name'];
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-slate">{label}</span>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon name={icon} size={20} className="text-white" />
      </div>
    </div>
    <div className="text-3xl font-bold text-teal-deep">{value.toLocaleString()}</div>
  </div>
);

const PlatformOverviewPage: React.FC<Props> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Icon name="spinner" size={24} className="text-teal-primary" />
        <span className="ml-3 text-slate">Loading platform stats...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-teal-deep">Platform Overview</h1>
        <p className="text-slate mt-1">System-wide statistics across all institutions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Schools" value={stats.totalSchools} icon="folder" color="bg-teal-primary" />
        <StatCard label="Admins" value={stats.totalAdmins} icon="user" color="bg-ocean-deep" />
        <StatCard label="Students" value={stats.totalStudents} icon="users" color="bg-teal-deep" />
        <StatCard label="AI Queries" value={stats.totalQueries} icon="chat" color="bg-teal-primary" />
        <StatCard
          label="Pending Approvals"
          value={stats.pendingRegistrations}
          icon="clock"
          color={stats.pendingRegistrations > 0 ? 'bg-amber-500' : 'bg-gray-400'}
        />
      </div>
    </div>
  );
};

export default PlatformOverviewPage;
