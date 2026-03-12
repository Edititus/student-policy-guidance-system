/**
 * AdminHeader Organism
 * Header bar for admin dashboard pages
 */

import React from 'react'
import { Button, Icon } from '../atoms'
import type { AdminTab } from '../../types'
import { useAuth } from '../../context/AuthContext'

interface IAdminHeaderProps {
  activeTab: AdminTab
  onRefresh: () => void
  adminName?: string
  adminEmail?: string
  adminSchool?: string
  onMobileMenuOpen?: () => void
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
}

const AdminHeader: React.FC<IAdminHeaderProps> = ({
  activeTab,
  onRefresh,
  adminName = 'Admin',
  adminEmail = '',
  adminSchool = '',
  onMobileMenuOpen,
}) => {
  const { logout } = useAuth()
  const config = tabConfig[activeTab]

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 sm:px-6 md:px-8 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Open navigation"
          >
            <Icon name="menu" size={22} className="text-slate" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-semibold text-teal-deep truncate">
              {config.title}
            </h1>
            <p className="text-sm text-slate mt-0.5 hidden sm:block">{config.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            leftIcon={<Icon name="refresh" size={16} />}
            className="hidden sm:flex"
          >
            Refresh
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-teal-primary rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="text-right hidden md:block">
              <div className="text-sm font-medium text-teal-deep truncate max-w-[140px]">
                {adminName}
              </div>
              <div className="text-xs text-slate truncate max-w-[140px]">{adminEmail}</div>
              {adminSchool && (
                <div className="text-xs font-medium text-teal-primary bg-teal-mist px-2 py-0.5 rounded-full mt-0.5 inline-block truncate max-w-[140px]">
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
            <Icon name="logout" size={16} className="sm:mr-1" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
