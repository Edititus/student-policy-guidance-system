/**
 * AdminHeader Organism
 * Header bar for admin dashboard pages
 */

import React from 'react';
import { Button, Icon } from '../atoms';
import type { AdminTab } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface IAdminHeaderProps {
  activeTab: AdminTab;
  onRefresh: () => void;
  adminName?: string;
  adminEmail?: string;
  adminSchool?: string;
}

const tabConfig: Record<AdminTab, { title: string; subtitle: string }> = {
  overview: {
    title: 'Dashboard Overview',
    subtitle: 'Monitor system performance and recent activity',
  },
  queries: {
    title: 'Escalated Queries',
    subtitle: 'Review and respond to flagged queries',
  },
  policies: {
    title: 'Policy Management',
    subtitle: 'Manage your policy knowledge base',
  },
  students: {
    title: 'Student Management',
    subtitle: 'Manage student accounts and approvals',
  },
  analytics: {
    title: 'Analytics & Reports',
    subtitle: 'Detailed insights and data export',
  },
};

const AdminHeader: React.FC<IAdminHeaderProps> = ({
  activeTab,
  onRefresh,
  adminName = 'Admin',
  adminEmail = '',
  adminSchool = '',
}) => {
  const { logout } = useAuth();
  const config = tabConfig[activeTab];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-teal-deep">{config.title}</h1>
          <p className="text-sm text-slate mt-0.5">{config.subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            leftIcon={<Icon name="refresh" size={16} />}
          >
            Refresh
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-teal-primary rounded-full flex items-center justify-center text-white font-medium text-sm">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-teal-deep">{adminName}</div>
              <div className="text-xs text-slate">{adminEmail}</div>
              {adminSchool && (
                <div className="text-xs font-medium text-teal-primary bg-teal-mist px-2 py-0.5 rounded-full mt-0.5 inline-block">
                  {adminSchool}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={logout}
            className="text-red-600 hover:bg-red-50"
          >
            <Icon name="logout" size={16} className="mr-1" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
