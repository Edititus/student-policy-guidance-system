/**
 * SuperAdminDashboard — Layout wrapper for super admin pages
 * Sidebar + header, tab-based navigation similar to AdminDashboardRefactored
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../components/atoms';
import type { IconName } from '../../components/atoms';
import { useAuth } from '../../context/AuthContext';
import { usePlatformStats } from '../../hooks/useSuperAdmin';
import PlatformOverviewPage from './PlatformOverviewPage';
import AdminManagementPage from './AdminManagementPage';
import SchoolManagementPage from './SchoolManagementPage';
import SystemSettingsPage from './SystemSettingsPage';
import aspgIcon from '../../aspg-icon.svg';

type SuperAdminTab = 'overview' | 'admins' | 'schools' | 'settings';

const ALLOWED_TABS: SuperAdminTab[] = ['overview', 'admins', 'schools', 'settings'];

function coerceTab(value?: string): SuperAdminTab {
  return ALLOWED_TABS.includes(value as SuperAdminTab) ? (value as SuperAdminTab) : 'overview';
}

interface INavItem {
  id: SuperAdminTab;
  label: string;
  iconName: IconName;
}

const navItems: INavItem[] = [
  { id: 'overview', label: 'Platform Overview', iconName: 'grid' },
  { id: 'admins', label: 'Admin Management', iconName: 'users' },
  { id: 'schools', label: 'Schools', iconName: 'folder' },
  { id: 'settings', label: 'System Settings', iconName: 'cog' },
];

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  const activeTab = coerceTab(tab);
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: statsData, isLoading: statsLoading } = usePlatformStats();
  const stats = statsData?.data || null;

  const onTabChange = (nextTab: SuperAdminTab) => {
    navigate(`/platform/${nextTab}`);
  };

  return (
    <div className="min-h-screen bg-smoke flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-gray-900 flex-shrink-0 transition-all duration-300`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <img src={aspgIcon} alt="ASPG" className="w-10 h-10" />
              {!sidebarCollapsed && (
                <div>
                  <div className="text-white font-semibold text-sm">AI Policy Guidance</div>
                  <div className="text-amber-400 text-xs">Super Admin</div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                  activeTab === item.id
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon name={item.iconName} size={20} />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Collapse Toggle */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={() => setSidebarCollapsed((v) => !v)}
              className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Icon
                name="chevron-double-left"
                size={20}
                className={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-teal-deep capitalize">
                {navItems.find((n) => n.id === activeTab)?.label || 'Super Admin'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-teal-deep">{user?.name || 'Super Admin'}</div>
                <div className="text-xs text-slate">{user?.email}</div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <Icon name="logout" size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8">
          {activeTab === 'overview' && (
            <PlatformOverviewPage stats={stats} isLoading={statsLoading} />
          )}
          {activeTab === 'admins' && <AdminManagementPage />}
          {activeTab === 'schools' && <SchoolManagementPage />}
          {activeTab === 'settings' && <SystemSettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
