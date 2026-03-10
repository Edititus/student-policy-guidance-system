/**
 * Admin Overview Page
 * Dashboard stats, quick actions, and recent activity
 */

import React from 'react';
import type { IDashboardStats, IActivity, IEscalatedQuery } from '../../types';
import { Card, Icon, Spinner } from '../../components/atoms';

interface IOverviewPageProps {
  stats: IDashboardStats;
  recentActivity: IActivity[];
  escalatedQueries: IEscalatedQuery[];
  uploadProgress: number;
  onTabChange: (tab: 'overview' | 'queries' | 'policies' | 'analytics') => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
}

const OverviewPage: React.FC<IOverviewPageProps> = ({
  stats,
  recentActivity,
  escalatedQueries,
  uploadProgress,
  onTabChange,
  onFileUpload,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" label="Loading overview..." />
      </div>
    );
  }

  const timeAgo = (timestamp: string): string => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const severityColors: Record<string, string> = {
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    info: 'bg-teal-primary',
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-teal-mist rounded-lg flex items-center justify-center">
              <Icon name="chat" size={20} className="text-teal-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-deep">{stats.totalQueries}</div>
          <div className="text-sm text-slate">Total Queries</div>
        </Card>

        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Icon name="check-circle" size={20} className="text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-deep">{(stats.averageConfidence * 100).toFixed(0)}%</div>
          <div className="text-sm text-slate">Avg Confidence</div>
        </Card>

        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Icon name="warning" size={20} className="text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-deep">{(stats.escalationRate * 100).toFixed(1)}%</div>
          <div className="text-sm text-slate">Escalation Rate</div>
        </Card>

        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Icon name="star" size={20} className="text-yellow-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-deep">{stats.averageRating.toFixed(1)}</div>
          <div className="text-sm text-slate">Avg Rating</div>
        </Card>

        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-ocean-deep/10 rounded-lg flex items-center justify-center">
              <Icon name="users" size={20} className="text-ocean-deep" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-deep">{stats.uniqueStudents}</div>
          <div className="text-sm text-slate">Active Students</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="outlined" padding="md">
        <h2 className="text-lg font-semibold text-teal-deep mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-center justify-center p-5 border-2 border-dashed border-gray-200 rounded-xl hover:border-teal-primary hover:bg-teal-mist/30 cursor-pointer transition-all group">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={onFileUpload}
            />
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-mist rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-primary transition-colors">
                <Icon name="upload" size={24} className="text-teal-primary group-hover:text-white transition-colors" />
              </div>
              <div className="text-sm font-medium text-teal-deep">Upload Policy</div>
              <div className="text-xs text-slate mt-1">PDF, DOCX, TXT</div>
            </div>
          </label>

          <button
            onClick={() => onTabChange('queries')}
            className="p-5 border-2 border-gray-200 rounded-xl hover:border-teal-primary hover:bg-teal-mist/30 transition-all group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3 relative">
                <Icon name="warning" size={24} className="text-red-500" />
                {escalatedQueries.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {escalatedQueries.length}
                  </span>
                )}
              </div>
              <div className="text-sm font-medium text-teal-deep">Review Escalations</div>
              <div className="text-xs text-slate mt-1">{escalatedQueries.length} pending</div>
            </div>
          </button>

          <button
            onClick={() => onTabChange('analytics')}
            className="p-5 border-2 border-gray-200 rounded-xl hover:border-teal-primary hover:bg-teal-mist/30 transition-all group"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-ocean-deep/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Icon name="chart-bar" size={24} className="text-ocean-deep" />
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
              />
            </div>
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <Card variant="outlined" padding="md">
        <h2 className="text-lg font-semibold text-teal-deep mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <div className="text-center py-6 text-slate">
              <Icon name="clock" size={40} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 hover:bg-smoke rounded-lg transition-colors">
                <div className={`w-2 h-2 ${severityColors[activity.severity] || 'bg-gray-500'} rounded-full`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-teal-deep">{activity.title}</div>
                  <div className="text-xs text-slate">{activity.description}</div>
                </div>
                <div className="text-xs text-slate">{timeAgo(activity.timestamp)}</div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default OverviewPage;
