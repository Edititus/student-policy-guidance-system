import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useAnalytics,
  useAdminStats,
  useCoverageGaps,
  useEscalatedQueries,
  useExportData,
  useRecentActivity,
  useRespondToQuery,
  useDismissQuery,
  useDeleteQuery,
} from '../hooks/useAdmin';
import { useActivatePolicy, useDeactivatePolicy, useDeletePolicy, usePolicies, useUpdatePolicy, useUploadPolicy } from '../hooks/usePolicies';
import { AdminHeader, AdminSidebar } from './organisms';
import { AnalyticsPage, OverviewPage, PoliciesPage, QueriesPage, StudentsPage } from '../pages/admin';
import type { AdminTab } from '../types';
import { policiesApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ALLOWED_TABS: AdminTab[] = ['overview', 'queries', 'students', 'policies', 'analytics'];

function coerceTab(value?: string): AdminTab {
  return ALLOWED_TABS.includes(value as AdminTab) ? (value as AdminTab) : 'overview';
}

const AdminDashboardRefactored: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  const activeTab = coerceTab(tab);
  const { user } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<{
    progress: number;
    stage: 'idle' | 'uploading' | 'parsing' | 'processing' | 'complete' | 'error';
    message: string;
    fileName?: string;
  }>({
    progress: 0,
    stage: 'idle',
    message: '',
  });

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
  const { data: escalatedData, isLoading: escalatedLoading, refetch: refetchEscalated } = useEscalatedQueries({ includeResponded: true });
  const { data: policiesData, isLoading: policiesLoading, refetch: refetchPolicies } = usePolicies();
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics('week');
  const { data: activityData, isLoading: activityLoading } = useRecentActivity(10);
  const { data: coverageGapData, isLoading: coverageGapLoading } = useCoverageGaps(10);

  const respondMutation = useRespondToQuery();
  const dismissMutation = useDismissQuery();
  const deleteQueryMutation = useDeleteQuery();
  const exportMutation = useExportData();
  const uploadMutation = useUploadPolicy();
  const activateMutation = useActivatePolicy();
  const deactivateMutation = useDeactivatePolicy();
  const updateMutation = useUpdatePolicy();
  const deleteMutation = useDeletePolicy();

  const stats = statsData?.data || {
    totalQueries: 0,
    averageConfidence: 0,
    escalationRate: 0,
    averageRating: 0,
    uniqueStudents: 0,
    totalPolicies: 0,
    totalUsers: 0,
  };

  const escalatedQueries = escalatedData?.data || [];

  // Only pending/in_review items count as "needing attention".
  // Dismissed and responded queries must NOT inflate the badge or Overview count.
  const pendingEscalatedQueries = escalatedQueries.filter((q) => {
    const status = q.escalationStatus ?? (q.responded ? 'resolved' : 'pending');
    return status === 'pending' || status === 'in_review';
  });

  const policies = policiesData?.data || [];
  const analytics = analyticsData?.data || null;
  const recentActivity = activityData?.data || [];
  const coverageGaps = coverageGapData?.data || [];

  const isLoading = useMemo(
    () =>
      statsLoading ||
      escalatedLoading ||
      policiesLoading ||
      activityLoading ||
      analyticsLoading ||
      coverageGapLoading,
    [statsLoading, escalatedLoading, policiesLoading, activityLoading, analyticsLoading, coverageGapLoading]
  );

  const onTabChange = (nextTab: AdminTab) => {
    navigate(`/admin/${nextTab}`);
  };

  const onRefresh = () => {
    refetchStats();
    refetchEscalated();
    refetchPolicies();
  };

  const onFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (user?.schoolId) {
      formData.append('schoolId', user.schoolId);
    }

    setUploadProgress(10);
    setUploadStatus({
      progress: 10,
      stage: 'uploading',
      message: 'Uploading document',
      fileName: file.name,
    });

    try {
      const response = await uploadMutation.mutateAsync(formData);
      const jobId = response?.data?.jobId;

      setUploadProgress(30);
      setUploadStatus({
        progress: 30,
        stage: 'parsing',
        message: 'Parsing and structuring policy',
        fileName: file.name,
      });

      if (!jobId) {
        setUploadProgress(100);
        setUploadStatus({
          progress: 100,
          stage: 'complete',
          message: 'Upload complete',
          fileName: file.name,
        });
        return;
      }

      let localProgress = 30;
      let done = false;
      for (let attempts = 0; attempts < 300 && !done; attempts++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        let status;
        try {
          status = await policiesApi.getProcessingStatus(jobId);
        } catch {
          continue;
        }
        const job = status?.data;
        if (!job || typeof job !== 'object') continue;
        const typedJob = job as {
          progress?: number;
          status?: string;
          error?: string;
        };
        const stage =
          typedJob.status === 'embedding'
            ? 'processing'
            : typedJob.status === 'parsing' || typedJob.status === 'ocr'
              ? 'parsing'
              : typedJob.status === 'complete'
                ? 'complete'
                : typedJob.status === 'error'
                  ? 'error'
                  : 'uploading';
        const newProgress = Math.max(typedJob.progress || 0, localProgress);
        localProgress = newProgress;
        setUploadProgress(newProgress);
        setUploadStatus({
          progress: newProgress,
          stage,
          message:
            typedJob.status === 'complete'
              ? 'Policy ready for retrieval'
              : typedJob.status === 'error'
                ? typedJob.error || 'Processing failed'
                : typedJob.status === 'embedding'
                  ? `Embedding chunks… ${typedJob.progress || 50}%`
                  : 'Processing policy',
          fileName: file.name,
        });

        if (typedJob.status === 'complete' || typedJob.status === 'error') {
          done = true;
        }
      }

      onRefresh();
    } catch (error) {
      setUploadStatus({
        progress: uploadProgress || 0,
        stage: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
        fileName: file.name,
      });
    }
  };

  return (
    <div className="min-h-screen bg-smoke flex">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        escalationCount={pendingEscalatedQueries.length}
      />
      <div className="flex-1 min-w-0">
        <AdminHeader
          activeTab={activeTab}
          onRefresh={onRefresh}
          adminName={user?.name || user?.email || 'Admin'}
          adminEmail={user?.email || ''}
          adminSchool={user?.schoolId || ''}
        />
        <main className="p-6 md:p-8">
          {activeTab === 'overview' && (
            <OverviewPage
              stats={stats}
              recentActivity={recentActivity}
              escalatedQueries={pendingEscalatedQueries}
              uploadProgress={uploadProgress}
              onTabChange={onTabChange}
              onFileUpload={onFileUpload}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'queries' && (
            <QueriesPage
              queries={escalatedQueries}
              isLoading={escalatedLoading}
              onRespond={(queryId, response) => respondMutation.mutateAsync({ queryId, response }).then(() => {})}
              onDismiss={(queryId) => dismissMutation.mutateAsync(queryId).then(() => {})}
              onDelete={(queryId) => deleteQueryMutation.mutateAsync(queryId).then(() => {})}
              isResponding={respondMutation.isPending}
              isDismissing={dismissMutation.isPending}
              isDeleting={deleteQueryMutation.isPending}
            />
          )}
          {activeTab === 'policies' && (
            <PoliciesPage
              policies={policies}
              isLoading={policiesLoading}
              onFileUpload={onFileUpload}
              onActivatePolicy={(policyId) => activateMutation.mutateAsync(policyId).then(() => {})}
              onDeactivatePolicy={(policyId) => deactivateMutation.mutateAsync(policyId).then(() => {})}
              onUpdatePolicy={(policyId, data) => updateMutation.mutateAsync({ id: policyId, data }).then(() => {})}
              onDeletePolicy={(policyId) => deleteMutation.mutateAsync(policyId).then(() => {})}
              isUploading={uploadMutation.isPending}
              uploadStatus={uploadStatus}
              coverageGaps={coverageGaps}
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsPage
              analytics={analytics}
              isLoading={analyticsLoading}
              onExport={() => exportMutation.mutateAsync('queries').then(() => undefined)}
              isExporting={exportMutation.isPending}
            />
          )}
          {activeTab === 'students' && (
            <StudentsPage />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardRefactored;
