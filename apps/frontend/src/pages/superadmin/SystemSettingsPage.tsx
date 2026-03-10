/**
 * SystemSettingsPage — Placeholder for AI/system configuration
 * Display-only in MVP — shows current configuration info
 */

import React from 'react';
import { Icon } from '../../components/atoms';

const SystemSettingsPage: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-teal-deep">System Settings</h1>
        <p className="text-slate mt-1">Platform configuration and system information</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-mist flex items-center justify-center">
              <Icon name="cog" size={20} className="text-teal-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-teal-deep">AI Configuration</h3>
              <p className="text-sm text-slate">RAG pipeline settings</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-slate">Embedding Model</span>
              <span className="text-sm font-medium text-teal-deep">HuggingFace (configured via env)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-slate">Vector Database</span>
              <span className="text-sm font-medium text-teal-deep">pgvector (PostgreSQL)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-slate">JWT Expiry</span>
              <span className="text-sm font-medium text-teal-deep">2 hours</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate">Registration Mode</span>
              <span className="text-sm font-medium text-teal-deep">Admin Approval Required</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <Icon name="info-circle" size={20} className="text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">MVP Configuration</h4>
              <p className="text-sm text-amber-700 mt-1">
                System settings are managed through environment variables in this version.
                A full settings panel with live editing is planned for a future release.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
