/**
 * AdminSidebar Organism
 * Navigation sidebar for admin dashboard
 */

import React from 'react'
import { Icon } from '../atoms'
import type { IconName } from '../atoms'
import aspgIcon from '../../aspg-icon.svg'

export type AdminTab = 'overview' | 'queries' | 'students' | 'policies' | 'analytics'

interface INavItem {
  id: AdminTab
  label: string
  iconName: IconName
  badge?: number
}

interface IAdminSidebarProps {
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  collapsed: boolean
  onToggleCollapse: () => void
  escalationCount?: number
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const AdminSidebar: React.FC<IAdminSidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  escalationCount = 0,
  mobileOpen = false,
  onMobileClose,
}) => {
  const navItems: INavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      iconName: 'grid',
    },
    {
      id: 'queries',
      label: 'Escalations',
      iconName: 'warning',
      badge: escalationCount > 0 ? escalationCount : undefined,
    },
    {
      id: 'students',
      label: 'Students',
      iconName: 'users',
    },
    {
      id: 'policies',
      label: 'Policies',
      iconName: 'document',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      iconName: 'chart-bar',
    },
  ]

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onMobileClose} />
      )}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        ${collapsed ? 'lg:w-20' : 'lg:w-64'} w-64
        bg-teal-deep flex-shrink-0 transition-all duration-300
      `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <img src={aspgIcon} alt="ASPG" className="w-10 h-10" />
              {!collapsed && (
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
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start'} space-x-3 px-3 py-2.5 rounded-lg transition-all relative ${
                  activeTab === item.id
                    ? 'bg-teal-primary text-white'
                    : 'text-teal-mist hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon name={item.iconName} size={20} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                {item.badge !== undefined && (
                  <span
                    className={`${
                      collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'
                    } bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full`}
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
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 text-teal-mist hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Icon
                name="chevron-double-left"
                size={20}
                className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar
