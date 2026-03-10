/**
 * AuthHeader Component
 * Header bar with user info and dropdown menu
 */

import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../atoms'
import aspgIcon from '../../aspg-icon.svg'

const AuthHeader: React.FC = () => {
  const { user, logout, isAdmin } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  if (!user) return null

  return (
    <div className="sticky top-0 z-30 bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <img src={aspgIcon} alt="ASPG" className="w-8 h-8" />
            <div>
              <div className="font-semibold text-gray-900">AI Policy Guidance</div>
              <div className="text-xs text-gray-500">
                {user?.schoolName || 'Multi-University System'}
              </div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-expanded={showMenu}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 bg-teal-primary rounded-full flex items-center justify-center text-white font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
              <Icon
                name="chevron-down"
                size={16}
                className={`text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                  aria-hidden="true"
                ></div>
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20"
                  role="menu"
                  aria-orientation="vertical"
                >
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
                        role="menuitem"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span className="mr-2">👨‍💼</span>
                        Admin Dashboard
                      </a>
                    )}
                    <a
                      href="/profile"
                      role="menuitem"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className="mr-2">👤</span>
                      Profile Settings
                    </a>
                    <a
                      href="/help"
                      role="menuitem"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className="mr-2">❓</span>
                      Help & Support
                    </a>
                  </div>
                  <div className="border-t py-1">
                    <button
                      onClick={logout}
                      role="menuitem"
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <span className="mr-2">🚪</span>
                      Sign Out
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

export default AuthHeader
